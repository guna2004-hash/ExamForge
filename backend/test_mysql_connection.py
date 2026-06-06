import sys
from sqlalchemy import create_engine, text
from app.core.config import settings

def test_connection():
    print(f"Testing connection to: {settings.DATABASE_URL}")
    try:
        engine = create_engine(settings.DATABASE_URL)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("Successfully connected to MySQL database!")
            print(f"Result of 'SELECT 1': {result.scalar()}")
    except Exception as e:
        if "Unknown database" in str(e) or "1049" in str(e):
            print("\nDatabase does not exist. Attempting to create it...")
            try:
                db_url = settings.DATABASE_URL
                if "/" in db_url:
                    base_url, db_name = db_url.rsplit("/", 1)
                    if "?" in db_name:
                        db_name = db_name.split("?", 1)[0]
                    
                    temp_engine = create_engine(f"{base_url}/")
                    with temp_engine.connect() as conn:
                        conn.execution_options(isolation_level="AUTOCOMMIT")
                        conn.execute(text(f"CREATE DATABASE {db_name}"))
                        print(f"Database '{db_name}' created successfully!")
                    
                    # Try connecting again
                    with engine.connect() as conn:
                        result = conn.execute(text("SELECT 1"))
                        print("Successfully connected to MySQL database after creation!")
                        return
            except Exception as create_err:
                print(f"Failed to automatically create database: {create_err}")
        
        print("\nFailed to connect to MySQL database.")
        print(f"Error details: {e}")
        print("\nPlease make sure:")
        print("1. Your MySQL server is running.")
        print("2. The database 'aegis_exams' exists.")
        print("3. Your DATABASE_URL settings in backend/.env are correct.")
        sys.exit(1)


if __name__ == "__main__":
    # Add parent directory to path so app can be imported
    import os
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    test_connection()
