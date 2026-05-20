import React from 'react';

export const components = {
  a: (props: any) => <a {...props} />,
  pre: (props: any) => <pre {...props} style={{ overflowX: 'auto' }} />,
  code: (props: any) => <code {...props} style={{ background: 'rgba(0,0,0,0.04)', padding: '2px 6px', borderRadius: 6 }} />,
};

export default components;
