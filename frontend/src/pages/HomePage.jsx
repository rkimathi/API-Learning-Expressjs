import React from 'react';

const HomePage = () => {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-6">Welcome to TaskMaster!</h1>
      <p className="text-lg text-muted-foreground">
        Organize your life, one task at a time.
      </p>
      {/* We can add some call to action buttons here later using Shadcn UI */}
    </div>
  );
};

export default HomePage;
