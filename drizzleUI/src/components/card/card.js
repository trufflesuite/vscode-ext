import PropTypes from 'prop-types';
import React from 'react';
import './card.less';

class Card extends React.Component {
  render() {
    const { className, children } = this.props;

    return (
      <section className={`ui card ${className || ''}`}>
        {
          children
        }
      </section>
    );
  }
}

export default Card;

Card.propTypes = {
  children: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  className: PropTypes.string
};
