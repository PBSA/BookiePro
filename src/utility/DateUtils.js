import moment from 'moment';
import { I18n } from 'react-redux-i18n';
import { TimeRangePeriodTypes } from '../constants';

const days = [I18n.t('mybets.sun'), I18n.t('mybets.mon'),I18n.t('mybets.tue'), I18n.t('mybets.wed'),
  I18n.t('mybets.thu'),I18n.t('mybets.fri'),I18n.t('mybets.sat')];


const DateUtils = {
  //dateToFormat is unixformat date
  getFormattedDate(dateToFormat){
    if(moment(new Date(dateToFormat)).format("MM-DD-YYYY") === moment().format("MM-DD-YYYY"))
      return I18n.t('mybets.today') + ', ' + moment(new Date(dateToFormat)).format("HH:mm");
    else if(moment(new Date(dateToFormat)).format("MM-DD-YYYY") === moment().add(1, 'days').format("MM-DD-YYYY"))
      return I18n.t('mybets.tomorrow') + ', ' + moment(new Date(dateToFormat)).format("HH:mm");
    else if(moment(new Date(dateToFormat)).week() === moment().week() && moment(new Date(dateToFormat)) > moment())
      return days[moment(new Date(dateToFormat)).day()] + ', ' + moment(new Date(dateToFormat)).format("HH:mm");
    else{
      return moment(new Date(dateToFormat)).format("MM-DD-YYYY HH:mm");
    }
  },
  getTimeRangeGivenTimeRangePeriodType(timeRangePeriodType) {
    let startDate, endDate = null;
    switch (timeRangePeriodType) {
      case TimeRangePeriodTypes.LAST_7_DAYS: {
        //Subtract 6 days from the current day
        startDate = moment().subtract(6, 'days');
        endDate = moment();
        break;
      }
      case TimeRangePeriodTypes.LAST_14_DAYS: {
        //Subtract 14 days from the current day
        startDate = moment().subtract(13, 'days');
        endDate = moment();
        break;
      }
      case TimeRangePeriodTypes.THIS_MONTH: {
        //First of the current month, 12:00 am
        startDate = moment().startOf('month');
        endDate = moment();
        break;
      }
      case TimeRangePeriodTypes.LAST_MONTH: {
        //Last month's 1st day
        startDate = moment().subtract(1, 'months').startOf('month');
        //Last month's last day
        endDate = moment().subtract(1, 'months').endOf('month');
        break;
      }
      case TimeRangePeriodTypes.CUSTOM: {
        startDate = null;
        endDate = null;
        break;
      }
      default:
        break;
    }
    const timeRange = {
      startDate,
      endDate
    };
    return timeRange;
  }

}

export default DateUtils;
