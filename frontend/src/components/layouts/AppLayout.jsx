import React from 'react';
import { Link, Outlet } from 'react-router-dom';
// We'll use some basic Lucide icons for the nav links later
// For now, just text links.

const AppLayout = () => {
  return (
    <div className='min-h-screen flex flex-col bg-background text-foreground'>
      <header className='bg-primary text-primary-foreground shadow-md'>
        <nav className='container mx-auto px-4 py-3 flex justify-between items-center'>
          <Link to='/' className='text-xl font-bold hover:text-secondary transition-colors'>
            TaskMaster
          </Link>
          <div className='flex items-center space-x-2 sm:space-x-4'>
            <Link to='/' className='px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-foreground/10 hover:text-secondary transition-colors'>Home</Link>
            <Link to='/tasks' className='px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-foreground/10 hover:text-secondary transition-colors'>Tasks</Link>
            {/* TODO: Conditional rendering for Login/Register vs Profile/Logout based on auth state */}
            <Link to='/login' className='px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-foreground/10 hover:text-secondary transition-colors'>Login</Link>
            <Link to='/register' className='px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-foreground/10 hover:text-secondary transition-colors'>Register</Link>
            <Link to='/profile' className='px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-foreground/10 hover:text-secondary transition-colors'>Profile</Link>
          </div>
        </nav>
      </header>
      <main className='flex-grow container mx-auto px-4 py-8'>
        <Outlet /> {/* Child routes will render here */}
      </main>
      <footer className='bg-muted text-muted-foreground py-4 text-center text-sm'>
        <p>&copy; {new Date().getFullYear()} TaskMaster. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default AppLayout;
