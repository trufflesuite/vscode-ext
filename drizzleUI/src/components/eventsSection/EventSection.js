import PropTypes from 'prop-types';
import React from 'react';
import { TextField } from '@material-ui/core';

class EventSection extends React.Component {
  render() {
    const { events } = this.props;

    const eventsNotifications = events
      .reverse()
      .map(({ event }) => `${event} was called`)
      .join('\n');

    return <TextField
      className='metadata text field'
      disabled
      multiline
      fullWidth
      rows={8}
      id='contract-address'
      label='event:'
      value={eventsNotifications}
    />;
  }
}

export default EventSection;

EventSection.propTypes = {
  events: PropTypes.array.isRequired
};
