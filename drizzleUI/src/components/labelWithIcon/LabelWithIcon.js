import PropTypes from 'prop-types';
import React from 'react';
import { Tooltip } from '@material-ui/core';
import './labelWithIcon.less';

class LabelWithIcon extends React.Component {
  render() {
    const { text, icon } = this.props;

    return <Tooltip title='Copy' placement='top-end'>
      <div className='label-with-icon'>
        <span className='text'>{text}</span>
        {icon}
      </div>
    </Tooltip>;
  }
}

export default LabelWithIcon;

LabelWithIcon.propTypes = {
  text: PropTypes.string.isRequired,
  icon: PropTypes.node.isRequired
};
