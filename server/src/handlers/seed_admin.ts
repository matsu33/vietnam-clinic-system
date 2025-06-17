import { db } from '../db';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { register } from './auth';

export const seedAdmin = async (): Promise<void> => {
  try {
    console.log('🌱 Checking for existing admin user...');
    
    const adminUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.username, 'admin'))
      .execute();

    if (adminUser.length === 0) {
      console.log('👤 Admin user not found. Creating admin/admin...');
      
      // Use the register function to create the admin user
      await register({ 
        username: 'admin', 
        password: 'admin', 
        role: 'admin' 
      });
      
      console.log('✅ Admin user "admin/admin" created successfully!');
    } else {
      console.log('✅ Admin user "admin" already exists. Skipping creation.');
    }
  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
  }
};