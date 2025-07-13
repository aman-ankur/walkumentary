#!/usr/bin/env python3
"""
Script to apply the interests column type migration.
This fixes the PostgreSQL TEXT[] to JSONB conversion issue.
"""

import asyncio
import os
import sys
from pathlib import Path
from sqlalchemy import text

# Add the app directory to the Python path
sys.path.insert(0, str(Path(__file__).parent / "app"))

from app.database import engine
from app.config import settings

async def apply_migration():
    """Apply the interests column type migration."""
    
    print("🔄 Starting interests column type migration...")
    
    # Read the migration file
    migration_file = Path(__file__).parent / "app" / "migrations" / "fix_interests_column_type.sql"
    
    if not migration_file.exists():
        print(f"❌ Migration file not found: {migration_file}")
        return False
    
    with open(migration_file, 'r') as f:
        migration_content = f.read()
    
    print(f"📁 Migration file loaded: {migration_file}")
    
    # Split migration into individual statements
    statements = []
    for line in migration_content.split('\n'):
        line = line.strip()
        if line and not line.startswith('--'):
            statements.append(line)
    
    # Join statements that are split across lines and split by semicolon
    migration_sql = ' '.join(statements)
    individual_statements = [stmt.strip() for stmt in migration_sql.split(';') if stmt.strip()]
    
    print(f"📝 Found {len(individual_statements)} SQL statements to execute")
    
    try:
        # Get database connection using SQLAlchemy engine
        async with engine.begin() as conn:
            print("🔗 Connected to database")
            
            print("🚀 Executing migration statements...")
            for i, statement in enumerate(individual_statements, 1):
                print(f"   Executing statement {i}/{len(individual_statements)}")
                await conn.execute(text(statement))
            print("✅ Migration executed successfully")
            
            # Verify the migration worked by checking the column type
            result = await conn.execute(text("""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_name = 'tours' AND column_name = 'interests'
            """))
            
            row = result.fetchone()
            if row:
                print(f"✅ Column verification:")
                print(f"   Column: {row[0]}")
                print(f"   Type: {row[1]}")
                print(f"   Nullable: {row[2]}")
                
                if row[1] == 'jsonb':
                    print("🎉 Migration completed successfully! Column type is now JSONB")
                    return True
                else:
                    print(f"⚠️  Warning: Column type is {row[1]}, expected 'jsonb'")
                    return False
            else:
                print("❌ Could not verify column after migration")
                return False
                
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        return False

async def check_current_schema():
    """Check the current schema before migration."""
    
    print("🔍 Checking current database schema...")
    
    try:
        async with engine.connect() as conn:
            # Check current column type
            result = await conn.execute(text("""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_name = 'tours' AND column_name = 'interests'
            """))
            
            row = result.fetchone()
            if row:
                print(f"📊 Current schema:")
                print(f"   Column: {row[0]}")
                print(f"   Type: {row[1]}")
                print(f"   Nullable: {row[2]}")
                
                if row[1] == 'ARRAY':
                    print("⚠️  Column is currently TEXT[] - migration needed")
                    return True
                elif row[1] == 'jsonb':
                    print("✅ Column is already JSONB - no migration needed")
                    return False
                else:
                    print(f"🤔 Unexpected column type: {row[1]}")
                    return True
            else:
                print("❌ interests column not found in tours table")
                return False
                
    except Exception as e:
        print(f"❌ Schema check failed: {str(e)}")
        return False

async def main():
    """Main migration script."""
    
    print("🗺️  Walkumentary Database Migration")
    print("   Fix interests column type (TEXT[] → JSONB)")
    print("=" * 50)
    
    # Check if migration is needed
    needs_migration = await check_current_schema()
    
    if not needs_migration:
        print("✅ No migration needed. Schema is already correct.")
        return
    
    # Confirm before proceeding
    response = input("\n🤔 Do you want to proceed with the migration? (y/N): ")
    if response.lower() not in ['y', 'yes']:
        print("❌ Migration cancelled by user.")
        return
    
    # Apply migration
    success = await apply_migration()
    
    if success:
        print("\n🎉 Migration completed successfully!")
        print("   The interests column has been converted from TEXT[] to JSONB")
        print("   Tour generation should now work correctly.")
    else:
        print("\n❌ Migration failed!")
        print("   Please check the error messages above and try again.")

if __name__ == "__main__":
    asyncio.run(main())