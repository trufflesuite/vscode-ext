import PropTypes from 'prop-types';
import React from 'react';
import './button.less';

class Button extends React.Component {
  render() {
    const {
      text,
      style,
      onClick,
      className
    } = this.props;

    return (
      <a
        className={`ui button ${className}`}
        onClick={onClick}
        style={style}
      >
        {text}
      </a>
    );
  }
}

export default Button;

Button.propTypes = {
  style: PropTypes.object,
  text: PropTypes.string,
  onClick: PropTypes.func,
  className: PropTypes.string
};

Button.defaultProps = {
  onClick: () => {}
};
