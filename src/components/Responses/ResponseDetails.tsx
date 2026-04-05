import * as React from 'react';

import { ResponseModel } from '../../services/models';

import { UnderlinedHeader } from '../../common-elements';
import { DropdownOrLabel } from '../DropdownOrLabel/DropdownOrLabel';
import { MediaTypesSwitch } from '../MediaTypeSwitch/MediaTypesSwitch';
import { Schema } from '../Schema';

import { Extensions } from '../Fields/Extensions';
import { Markdown } from '../Markdown/Markdown';
import { ResponseHeaders } from './ResponseHeaders';
import { ResponseLinks } from './ResponseLinks';
import { ConstraintsView } from '../Fields/FieldConstraints';

export class ResponseDetails extends React.PureComponent<{ response: ResponseModel }> {
  render() {
    const { description, extensions, headers, links, content } = this.props.response;
    return (
      <>
        {description && <Markdown source={description} />}
        <Extensions extensions={extensions} />
        <ResponseHeaders headers={headers} />
        {links && links.length > 0 && <ResponseLinks links={links} />}
        <MediaTypesSwitch content={content} renderDropdown={this.renderDropdown}>
          {({ schema }) => {
            return (
              <>
                {schema?.type === 'object' && (
                  <ConstraintsView constraints={schema?.constraints || []} />
                )}
                <Schema skipWriteOnly={true} key="schema" schema={schema} />
              </>
            );
          }}
        </MediaTypesSwitch>
      </>
    );
  }

  private renderDropdown = props => {
    return (
      <UnderlinedHeader key="header">
        Response Schema: <DropdownOrLabel {...props} />
      </UnderlinedHeader>
    );
  };
}