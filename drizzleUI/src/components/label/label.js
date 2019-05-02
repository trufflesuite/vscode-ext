import PropTypes from 'prop-types';
import React from 'react';
import './label.less';

class Label extends React.Component {
  render() {
    const {
      text,
      style
    } = this.props;

    return (
      <div
        style={style}
        className='ui label'
      >
        {
          text
        }
      </div>
    );
  }
}

export default Label;

Label.propTypes = {
  text: PropTypes.string,
  style: PropTypes.object
};
