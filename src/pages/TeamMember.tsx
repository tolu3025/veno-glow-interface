
import React from 'react';
import { useParams } from 'react-router-dom';

const TeamMember = () => {
  const { id } = useParams();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Team Member {id}</h1>
      <p className="text-muted-foreground">Team member content will be added here.</p>
    </div>
  );
};

export default TeamMember;
