#!/usr/bin/env python3
"""
Set up database tables for Walkumentary
"""
import asyncio
import asyncpg
from pathlib import Path
import os
from dotenv import load_dotenv

async def setup_database():
    """Create database tables and policies"""
    
    # Load environment variables
    load_dotenv()
    
    # Get database URL
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL not found in environment variables")
        return False
    
    # Read SQL setup file
    sql_file = Path('supabase_setup.sql')
    if not sql_file.exists():
        print("❌ supabase_setup.sql file not found")
        return False
    
    sql_content = sql_file.read_text()
    
    try:
        print("🔗 Connecting to database...")
        # Connect to database
        conn = await asyncpg.connect(database_url)
        
        print("📋 Creating tables and policies...")
        # Execute the SQL
        await conn.execute(sql_content)
        
        print("✅ Database setup completed successfully!")
        
        # Verify tables were created
        tables = await conn.fetch("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('users', 'locations', 'tours', 'cache_entries')
            ORDER BY table_name
        """)
        
        print("\n📊 Created tables:")
        for table in tables:
            print(f"  ✅ {table['table_name']}")
        
        await conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Database setup failed: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(setup_database())
    if success:
        print("\n🎉 Ready to test the application!")
    else:
        print("\n💡 Try running the SQL manually in Supabase dashboard instead")