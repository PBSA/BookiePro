import FakeApi from '../dummyData/FakeApi';
import { LoadingStatus, ActionTypes } from '../constants';

/**
 * Private actions
 */
class CompetitorPrivateActions {
  static addCompetitors(competitors) {
    return {
      type: ActionTypes.COMPETITOR_ADD_COMPETITORS,
      competitors
    }
  }

  static setGetCompetitorsLoadingStatus(loadingStatus) {
    return {
      type: ActionTypes.COMPETITOR_SET_GET_COMPETITORS_LOADING_STATUS,
      loadingStatus
    }
  }
}

/**
 * Public actions
 */
class CompetitorActions {
  static getCompetitors(sportId) {
    return (dispatch) => {
      dispatch(CompetitorPrivateActions.setGetCompetitorsLoadingStatus(LoadingStatus.LOADING));

      // TODO: Replace with actual blockchain call
      FakeApi.getCompetitors(sportId).then((competitors) => {
        dispatch(CompetitorPrivateActions.setGetCompetitorsLoadingStatus(LoadingStatus.DONE));
        dispatch(CompetitorPrivateActions.addCompetitors(competitors));
      });

    };
  }
}

export default CompetitorActions;
