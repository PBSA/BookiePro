import React, { PureComponent } from 'react';
import { Card,Icon } from 'antd';
import { I18n } from 'react-redux-i18n';
import { ExportUtils, FileSaverUtils } from '../../utility';
import moment from 'moment';
import { LoadingStatus } from '../../constants';

class Export extends PureComponent{

  constructor(props){
    super(props);
    this.handleDownloadClick = this.handleDownloadClick.bind(this);
  }

  //Copy the contents from the store to an excel file and download it
  handleDownloadClick(){
    let content = ExportUtils.formatDataForExport(this.props.exportData, null, { toBytes: true });
    let blob = new Blob([content], { type: 'application/vnd.ms-excel;charset=charset=utf-8' });
    FileSaverUtils.saveAs(blob, this.props.screenName + moment().format("YYYY-MM-DD_HH-mm-ss") + '.xlsx');
    /*
      - 'No results' has to be displayed if data is not available.
      - 'No results' gets displayed after successfull download as well since we are clearing the data store.
      - Hence, to display it only when data is not available, we reset the export status back to 'default'
        to diffrentiate the above 2 scenarios
    */

    // Call callback
    this.props.handleExportFinishDownload();
  }

  /*
    Display 'loading' card when data is being fetched to exportData
    Display 'download' card when the data is ready to be downloaded
    Display 'no results' card when there is no data
  */
  render(){
    return(
        this.props.exportLoadingStatus===LoadingStatus.LOADING ?
          <div className={ this.props.screenName === I18n.t('mybets.screenName') ?
              'export-overlay-top export-overlay' : 'export-overlay' }>
            <Card className='export-card' title={ I18n.t('application.exportLoadingHeader') }>
              <p>{ I18n.t('application.exportDataFetchMsg') }</p>
              <div className='loader-icon-main'>
                {/* TODO: Loader icon change as per mockup */}
                <Icon type='loading'></Icon>
              </div>
              <div className='card-footer'>
                <button className='btn cancel-btn'
                  onClick={ () => { this.props.resetExport() } }>{ I18n.t('mybets.cancel') }
                </button>
              </div>
            </Card>
          </div> :
        this.props.exportData && this.props.exportData.length > 0
          && this.props.exportLoadingStatus===LoadingStatus.DONE ?
          <div className={ this.props.screenName === I18n.t('mybets.screenName') ?
              'export-overlay-top export-overlay' : 'export-overlay' }>
            <Card className='export-card' title={ I18n.t('application.exportDownloadHeader') }>
              <p>{ I18n.t('application.exportDataReadyMsg') }</p>
              <div className='card-footer'>
                <button className='btn btn-primary download'
                  onClick={ () => { this.handleDownloadClick() } }>{ I18n.t('application.download') }
                </button>
                <button className='btn cancel-btn'
                  onClick={ () => { this.props.resetExport() } }>{ I18n.t('mybets.cancel') }
                </button>
              </div>
            </Card>
          </div>
        :null
    )
  }
}
export default Export
