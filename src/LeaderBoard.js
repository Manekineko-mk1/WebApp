/*global FB*/
import React, { Component } from 'react';
import * as firebase from 'firebase';
import config, {constant} from './config/default';
import Button from 'material-ui/Button';
import Dialog, { DialogTitle } from 'material-ui/Dialog';
import IconButton from 'material-ui/IconButton';
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';
import AppBar from 'material-ui/AppBar';
import Toolbar from 'material-ui/Toolbar';
import Typography from 'material-ui/Typography';
import CloseIcon from 'material-ui-icons/Close';
import Slide from 'material-ui/transitions/Slide';
import List, { ListItem, ListItemIcon, ListItemText } from 'material-ui/List';
import {connect} from "react-redux";
import { toggleLeaderBoard } from './actions';

function Transition(props) {
  return <Slide direction="right" {...props} />;
}


const styles = {
  appBar: {
    position: 'relative',
  },
  flex: {
    flex: 1,
  },
};

class LeaderBoard extends React.Component {
  constructor(props) {
    super(props);
  }    

  handleRequestClose = () => {
    this.props.toggleLeaderBoard(false);
  };

  
  render() {
    const { classes, open } = this.props;
    return (
      <Dialog fullScreen  open={open} onRequestClose={this.handleRequestClose} transition={Transition} unmountOnExit>
        <AppBar className={classes.appBar}>
          <Toolbar>
            <IconButton color="contrast" onClick={this.handleRequestClose} aria-label="Close">
            <CloseIcon />
          </IconButton>
          <Typography variant="title" color="inherit" className={classes.flex}>{constant.leaderBoardLabel}</Typography>           
           </Toolbar>
          </AppBar>
        </Dialog>);
  }
}

LeaderBoard.propTypes = {
  classes: PropTypes.object.isRequired,
};

const mapStateToProps = (state, ownProps) => {
  return {
    open: state.leaderBoard.open,
  };
}

const mapDispatchToProps = (dispatch) => {
  return {
    toggleLeaderBoard: flag => 
      dispatch(toggleLeaderBoard(flag)),
  }
};


export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(LeaderBoard));
