// styled.elements.ts

import styled from 'styled-components';

export const LinksCaption = styled.h2`
  color: #333;
  font-size: 1.5em;
`;

export const LinkItemContainer = styled.div`
  display: flex;
  align-items: center;
  margin: 10px 0;
`;

export const LinkTitle = styled.h3`
  color: #007BFF;
  font-size: 1.25em;
`;

export const LinkDescription = styled.p`
  color: #666;
`;

export const LinkOperationInfo = styled.span`
  font-weight: bold;
`;

export const LinkParameters = styled.ul`
  list-style: none;
  padding: 0;
`;

export const LinkParameterItem = styled.li`
  margin: 5px 0;
`;

export const LinkUnreachable = styled.span`
  color: red;
  font-style: italic;
`;
