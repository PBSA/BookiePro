import { ActionTypes } from '../constants';
import { LoadingStatus } from '../constants';

let initialState = {
  loadingStatus: LoadingStatus.DEFAULT,
  eventGroups: []
};

export default function (state = initialState, action) {
  switch(action.type) {
    case ActionTypes.EVENT_GROUP_SET_LOADING_STATUS: {
      return Object.assign({}, state, {
        loadingStatus: action.loadingStatus
      });
    }
    case ActionTypes.EVENT_GROUP_SET_EVENT_GROUPS: {
      return Object.assign({}, state, {
        eventGroups: action.eventGroups
      });
    }
    default:
      return state;
  }
}
