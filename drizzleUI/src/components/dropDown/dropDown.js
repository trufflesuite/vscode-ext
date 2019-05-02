import PropTypes from 'prop-types';
import React from 'react';
import './dropDown.less';

class DropDown extends React.PureComponent {
  render() {
    const {
      style,
      options,
      value,
      onChange,
      name
    } = this.props;

    return (
      <div
        style={style}
        className='ui dropdown'
      >
        <select
          value={value}
          name={name}
          onChange={onChange}
        >
          {
            options.map((option, index) => (
              <option
                key={index}
                value={option.value}
              >
                {option.name}
              </option>
            ))
          }
        </select>
      </div>
    );
  }
}

export default DropDown;

DropDown.propTypes = {
  onChange: PropTypes.func,
  options: PropTypes.array,
  value: PropTypes.string,
  name: PropTypes.string,
  style: PropTypes.shape({
    width: PropTypes.string
  })
};

DropDown.defaultProps = {
  style: {},
  options: [],
  onChange: () => {}
};
