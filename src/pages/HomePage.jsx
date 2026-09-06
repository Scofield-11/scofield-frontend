import React from 'react';
import Dashboard from '../components/Dashboard';
import VocabularyList from '../components/VocabularyList';

function HomePage() {
  return (
    <>
      <Dashboard />
      <hr className="my-5 opacity-25" style={{ maxWidth: '850px', margin: '0 auto' }} />
      <VocabularyList />
    </>
  );
}

export default HomePage;