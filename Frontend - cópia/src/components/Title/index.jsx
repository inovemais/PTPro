import React from 'react';

const Title = ({ text, children, className, highlighted }) => {
  const finalClassName = highlighted ? `title-highlighted ${className || ''}`.trim() : className;
  
  return (
    <h1 className={finalClassName} data-testid="title">
      {text || children}
    </h1>
  );
};

export default Title;

