from fastapi import FastAPI, File, UploadFile, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
from passlib.context import CryptContext
from dotenv import load_dotenv
from datetime import datetime, timedelta
import psycopg2
import os
import secrets
from io import BytesIO
import fitz  # PyMuPDF
from langchain.text_splitter import CharacterTextSplitter
from langchain_community.vectorstores import faiss
from langchain_openai import OpenAIEmbeddings
from langchain_openai import ChatOpenAI
from langchain.chains.conversational_retrieval.base import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
import logging

# Load environment variables
load_dotenv()

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# OpenAI API settings
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
embeddings = OpenAIEmbeddings(openai_api_key=OPENAI_API_KEY)
llm = ChatOpenAI(openai_api_key=OPENAI_API_KEY)

# Database connection
conn = psycopg2.connect(
    dbname=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PSWD"),
    host=os.getenv("DB_HOST"),
    port=os.getenv("DB_PORT"),
)

# Authentication settings
SECRET_KEY = os.getenv("JWT_SECRET_KEY", secrets.token_urlsafe(64))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 300

pswd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

# FastAPI app initialization
app = FastAPI()
app.conversation = None

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
def create_tables():
    with conn.cursor() as cursor:
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                hashed_password TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """
        )

        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS files (
                id SERIAL PRIMARY KEY,
                filename VARCHAR(255) NOT NULL,
                file_content TEXT NOT NULL,
                uploaded_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """
        )
        conn.commit()
        logger.info("Tables created or verified successfully.")

create_tables()

# Utility functions
def verify_password(plain_password, hashed_password):
    return pswd_context.verify(plain_password, hashed_password)

def hash_password(password):
    return pswd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return username
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def extract_pdf_text(contents):
    pdf_document = fitz.open(stream=BytesIO(contents), filetype="pdf")
    extracted_text = ""
    for page_number in range(pdf_document.page_count):
        page = pdf_document.load_page(page_number)
        extracted_text += page.get_text()
    return extracted_text

def split_text(raw_text):
    text_splitter = CharacterTextSplitter(
        separator="\n", chunk_size=1000, chunk_overlap=300, length_function=len
    )
    return text_splitter.split_text(raw_text)

def create_vectorstore(text_chunks):
    vectorstore = faiss.FAISS.from_texts(texts=text_chunks, embedding=embeddings)
    return vectorstore

def setup_conversation_chain(vectorstore):
    memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)
    conversation_chain = ConversationalRetrievalChain.from_llm(
        llm=llm, retriever=vectorstore.as_retriever(), memory=memory
    )
    return conversation_chain

# Routes
@app.post("/register")
def register(username: str, email: str, password: str):
    hashed_password = hash_password(password)
    with conn.cursor() as cursor:
        try:
            cursor.execute(
                "INSERT INTO users (username, email, hashed_password) VALUES (%s, %s, %s) RETURNING id;",
                (username, email, hashed_password),
            )
            conn.commit()
            logger.info(f"User {username} registered successfully.")
            return {"message": "User registered successfully"}
        except psycopg2.Error as e:
            conn.rollback()
            logger.error(f"Error registering user: {e}")
            raise HTTPException(status_code=400, detail="User already exists.")
        
@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    with conn.cursor() as cursor:
        cursor.execute(
            "SELECT id, username, hashed_password FROM users WHERE username = %s;", (form_data.username,)
        )
        user = cursor.fetchone()

    if not user or not verify_password(form_data.password, user[2]):
        logger.warning("Invalid login attempt.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user[1]})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        logger.warning("Invalid file format uploaded.")
        return JSONResponse(content={"message": "Only PDF files are allowed."}, status_code=400)

    content = await file.read()
    raw_text = extract_pdf_text(content)

    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "INSERT INTO files (filename, file_content, uploaded_by) VALUES (%s, %s, (SELECT id FROM users WHERE username = %s)) RETURNING id;",
                (file.filename, raw_text, "some_username")  # Ensure "some_username" is replaced with actual user info
            )
            conn.commit()

        text_chunks = split_text(raw_text)
        vectorstore = create_vectorstore(text_chunks)
        app.conversation = setup_conversation_chain(vectorstore)

        logger.info(f"File {file.filename} processed successfully.")
        return JSONResponse(content={"message": "File processed successfully."}, status_code=200)

    except Exception as e:
        logger.error(f"Error processing file: {str(e)}")
        return JSONResponse(content={"message": "Error processing the file."}, status_code=500)
    


@app.post("/chat")
async def chat(question: str):
    logger.info(question)
    """
    Handle user queries and provide responses based on the uploaded content.
    """
    if app.conversation is None:
        logger.warning("Conversation chain is not initialized. Upload a file first.")
        raise HTTPException(
            status_code=400, detail="No file has been uploaded or processed yet."
        )

    try:
        # Generate response using the conversation chain
        response = app.conversation({"question": question})
        logger.info(f"Question: {question} | Response: {response['answer']}")

        return {
            "answer": response["answer"],
            "timestamp": datetime.utcnow().isoformat()  # Optional: Add timestamp to the response
        }
    except Exception as e:
        logger.error(f"Error generating response: {e}")
        raise HTTPException(
            status_code=500, detail="An error occurred while processing the question."
        )

