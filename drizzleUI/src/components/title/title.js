import PropTypes from 'prop-types';
import React from 'react';
import './title.less';

class Title extends React.Component {
  render() {
    const { text } = this.props;

    return (
      <div className='ui title'>
        {text}
      </div>
    );
  }
}

export default Title;

Title.propTypes = {
  text: PropTypes.string
};
