import React from 'react';

const Logo = ({ type = 'fullname', className = 'h-12' }) => {
  // Use public assets directly
  const acronymSrc = '/acronym_logo.svg';
  const fullnameSrc = '/fullname_logo.svg';

  return (
    <img 
        src={type === 'acronym' ? acronymSrc : fullnameSrc} 
        alt="Good Neighbor" 
        className={className}
    />
  );
};

export default Logo;
