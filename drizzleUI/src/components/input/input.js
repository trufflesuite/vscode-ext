import PropTypes from 'prop-types';
import React from 'react';
import './input.less';

class Input extends React.Component {
  render() {
    const {
      style,
      value,
      name,
      type,
      onChange,
      placeholder
    } = this.props;

    return (
      <div
        className='ui input'
      >
        <input
          style={style}
          type={type}
          name={name}
          placeholder={placeholder}
          onChange={onChange}
          value={value}
        />
      </div>
    );
  }
}

export default Input;

Input.propTypes = {
  style: PropTypes.shape({
    width: PropTypes.string
  }),
  type: PropTypes.string,
  onChange: PropTypes.func,
  name: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  placeholder: PropTypes.string
};

Input.defaultProps = {
  type: 'text',
  onChange: () => {}
};
