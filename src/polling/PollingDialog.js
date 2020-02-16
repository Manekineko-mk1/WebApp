import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import { withStyles } from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import CloseIcon from '@material-ui/icons/Close';
import Slide from '@material-ui/core/Slide';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import distance from '../util/Distance';
import { constant, addressEnum } from '../config/default';
import PollingView from './PollingView';
import PollingResultView from './PollingResultView';
import {getUserPollingResult, getPollingResult} from '../service/PollingDB';

const styles = theme => ({
  appBar: {
    position: 'relative',
  },
  root: {
     paddingRight: 0
  },
  dialogTitle: {
    position: 'relative',
    background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)'
  },
  pollingContainer: {
    display: 'flex',
    height: '5rem',
    alignItems: 'center',
    justifyContent: 'center',
  }
});

function Transition(props) {
  return <Slide direction="up" {...props} />;
}

class PollingDialog extends React.Component {
  constructor(props) {
      super(props);
      this.state = {
        open: false,
        isOutOfPollingRange: false,
        isAlreadyPolled: false,
        disabledPolling: true,
        polling: {},
        pollingResult: null,
        userPollingResult: null
      };
      this.handlePollingDialogCloseCallback = this.handlePollingDialogCloseCallback.bind(this);
  }

  componentDidMount() {
    const { polling, user, addressBook, geolocation, userPollingResult } = this.props;
    this.setState({polling})
    let outOfRange = true;
    // check for home or office address within the polling distance
    if(polling.pollingRange !== undefined && addressBook.addresses !== undefined && addressBook.addresses.length > 0) {
      addressBook.addresses.find((obj, index) => {
        if(obj.type !== addressEnum.other && obj.geolocation !== undefined && obj.geolocation !== null &&  obj.geolocation.latitude !== undefined && obj.geolocation.longitude !== undefined) {
          let dis = distance(geolocation.lng, geolocation.lat, obj.geolocation.longitude, obj.geolocation.latitude);
          console.log(`${polling.pollingRange} ${dis}`)
          if(polling.pollingRange > dis) {
            outOfRange = false;
          }
        }
        return;
      });
      if(outOfRange) {
        this.setState({isOutOfPollingRange: true, disabledPolling: true})
      };
    }

    if(this.state.userPollingResult !== null) {
        this.setState({isAlreadyPolled: true, disabledPolling: true});
    }
    this.updateResult();
    if(user !== null && user.user !== null) {
      this.updateUserResult();
    }
  }

  handleRequestOpen(evt) {
    evt.preventDefault();
    this.setState({open: true});
  }

  handleRequestClose = () => {
    this.setState({open: false});
  }

  handlePollingDialogCloseCallback() {
    this.updateResult();
    this.setState({
      open: false,
      disabledPolling: true,
      isAlreadyPolled: true,
    })
  }

  updateUserResult() {
    const { messageUUID, user } = this.props;
    return getUserPollingResult(messageUUID, user.user.uid).then((userPollingResult) => {
      if(userPollingResult !== null) {
        this.setState({
          isAlreadyPolled: true, 
          disabledPolling: true,
          userPollingResult: userPollingResult
        });
      } else {
        console.log(`no result`)
        if(!this.state.isOutOfPollingRange) {
          this.setState({
            disabledPolling: false,
          })
          console.log(`can vote`);
        }
      }
    })
  }

  updateResult() {
    console.log(`UpdateResult`);
    const { messageUUID } = this.props;
    return getPollingResult(messageUUID).then((result) => {
      if(result !== null) {
        this.setState({
          pollingResult: result,
        })
      } else {
        console.log(`No Result`);
      }
    });
  }

  renderPollingLabel() {
    const { status } = this.props;
    let pollingLabel = constant.pollingLabel;

    if(status === constant.statusOptions[1]) {
      pollingLabel = constant.isAlreadyEndedLabel;
    } else if(this.state.isAlreadyPolled) {
      pollingLabel = constant.isAlreadyPolledLabel;
    } else if(this.state.isOutOfPollingRange) {
      pollingLabel = constant.isOutOfPollingRangeLabel;
    }

    return (
      <span>
        { pollingLabel }
      </span>
    );
  }

  render() {
    const { classes, messageUUID } = this.props;
    const { polling, pollingResult } = this.state;
    return (
      <span>
        <Paper role="button" onClick={(evt) => this.handleRequestOpen(evt)}>
          <Grid container className={classes.pollingContainer} spacing={0}>
            <Grid item>
              { this.renderPollingLabel() }
            </Grid>
          </Grid>
        </Paper>
        <Dialog
          fullScreen
          open={this.state.open}
          onRequestClose={this.handleRequestClose}
          transition={Transition}
          unmountOnExit
        >
          <AppBar className={classes.dialogTitle}>
            <Toolbar className={classes.root}>
              <IconButton color="contrast" onClick={this.handleRequestClose} aria-label="Close">
                <CloseIcon />
              </IconButton>
                <Typography variant="title" color="inherit" className={classes.flex}>
                  { this.state.disabledPolling ? constant.pollingResultLabel : constant.polling }
                </Typography>

            </Toolbar>
          </AppBar>
          { this.state.disabledPolling ? <PollingResultView polling={polling} pollingResult={pollingResult}/> : <PollingView polling={polling} messageUUID={messageUUID} handlePollingDialogCloseCallback={this.handlePollingDialogCloseCallback}/>}
        </Dialog>
      </span>
    );
  }
}

PollingDialog.propTypes = {
  classes: PropTypes.object.isRequired,
  polling: PropTypes.object.isRequired,
  geolocation: PropTypes.object.isRequired,
  status: PropTypes.string.isRequired,
};

const mapStateToProps = (state, ownProps) => {
  return {
    user: state.user,
    addressBook: state.addressBook,
  };
}

const mapDispatchToProps = (dispatch) => {
  return {

  }
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withStyles(styles)(PollingDialog));
