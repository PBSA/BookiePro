/**
 * This component displays list of new notifications.
 * Sub-component used in Notification
 *   {@link NotificationItem} - used to render individual notification
 */
import React, { PureComponent } from 'react';
import NotificationItem from './NotificationItem';
import Ps from 'perfect-scrollbar';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import { I18n } from 'react-redux-i18n';
import {
  Card
} from 'antd';

export class Notification extends PureComponent{

  componentDidMount() {
    Ps.initialize(ReactDOM.findDOMNode(this.refs.notification));
  }

  componentDidUpdate(prevProps, prevState){
    Ps.update(ReactDOM.findDOMNode(this.refs.notification));
  }

  render(){
    let children = [];
    if (this.props.notifications.size > 0) {
      this.props.notifications.forEach((notification, index) => {
        const child = (
          <NotificationItem
            key={ index }
            message={ notification.get('content') }
            hasNotification={ 'has-' }
            date={ notification.get('date') }
            onClick={ () => { this.props.onClickItem(notification) } }
            onClickClose={ () => { this.props.onClickCloseItem(notification) } }
          />
        );
        children.push(child);
      });
    } else {
      const child = (
        // TODO: If setting message to notification.empty, set styles to non-clickable.
        <NotificationItem
          key='placeholder'
          message={ I18n.t('notification.empty') }
          hasNotification={ '' }
          isDateVisible={ false }
          isCloseButtonVisible={ false }
        />
      );
      children.push(child);
    }

    return(
      <Card className='notification-card'>
        <div  className='notification-card-content' ref='notification'>
          { children }
        </div>
      </Card>
    )
  }
}

Notification.propTypes = {
  onClickItem: PropTypes.func,
  onClickCloseItem: PropTypes.func,
  notifications: React.PropTypes.instanceOf(Immutable.List)
}

Notification.defaultProps = {
  onClickItem: () => {},
  onClickCloseItem: () => {}
}

export default Notification;
