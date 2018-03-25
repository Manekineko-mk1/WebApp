/*global FB*/
import React, { Component } from 'react';
import * as firebase from 'firebase';
import { Form, FormGroup, Label, Input} from 'reactstrap';
import { FormText, FormControl } from 'material-ui/Form';
import LocationButton from './LocationButton';
import config from './config/default';
import Button from 'material-ui/Button';
import AddIcon from 'material-ui-icons/Add';
import Dialog, { DialogTitle } from 'material-ui/Dialog';
import TextField from 'material-ui/TextField';
import InputLabel from 'material-ui/Input/InputLabel';
import IconButton from 'material-ui/IconButton';
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';
import List, { ListItem, ListItemText } from 'material-ui/List';
import Divider from 'material-ui/Divider';
import AppBar from 'material-ui/AppBar';
import Toolbar from 'material-ui/Toolbar';
import Typography from 'material-ui/Typography';
import CloseIcon from 'material-ui-icons/Close';
import Slide from 'material-ui/transitions/Slide';
import geoString from './GeoLocationString';
import {getUserProfile, updateUserLocation, getUserRecords, updateUserProfile} from './UserProfile';
import UploadImageButton from './UploadImageButton';
import uuid from 'js-uuid';
import  {constant} from './config/default';

function Transition(props) {
  return <Slide direction="right" {...props} />;
}

/* eslint-disable flowtype/require-valid-file-annotation */

const currentLocationLabel = "現在位置";
const officeLocationLabel = "辦公室位置";
const homeLocationLabel = "屋企位置";

const styles = {
  appBar: {
    position: 'relative',
  },
  flex: {
    flex: 1,
  },
};

class UserProfileView extends React.Component {
    constructor(props) {
        super(props);
        var id = uuid.v4();
        this.state = {
            open: false,
            user: null, 
            imageURL: null, 
            publicImageURL: null, 
            thumbnailImageURL: null, 
            thumbnailPublicImageURL: null
        };
        this.path = 'UserProfile';
        this.thumbnailFilename = 'profile_' + id + '.jpg';
        this.openDialog = this.openDialog.bind(this);
        this.props.openDialog(this.openDialog);
    }    

  openDialog = () => {
    console.log('UserProfile Open'); 
    this.setState({ open: true });
  };

  handleRequestClose = () => {
    this.setState({ open: false });
  };

  componentDidMount() {
    var auth = firebase.auth();
    auth.onAuthStateChanged((user) => {
      if (user) {
        getUserProfile(user).then((userProfile)=>{
            this.setState({user: user, userProfile: userProfile});});
      }
    });
  }

  onSubmit() {
    this.setState({ open: false });
    /*
      Updating User Profile Image in DB
    */
    var userProfile = this.state.userProfile;
    if(this.state.thumbnailPublicImageURL != null) {
      userProfile.photoURL = this.state.thumbnailPublicImageURL;
    }
    var rv = updateUserProfile(this.state.user, userProfile);

    if(rv){
      this.setState({userProfile: userProfile});
    }
  }

  uploadFinish(imageURL, publicImageURL, thumbnailImageURL, thumbnailPublicImageURL) {  
    this.setState({
      imageURL: imageURL, 
      publicImageURL: publicImageURL, 
      thumbnailImageURL: thumbnailImageURL, 
      thumbnailPublicImageURL: thumbnailPublicImageURL
    });
    }

  render() {
    const { classes } = this.props;
    var imgURL = '/images/profile_placeholder.png';
    var displayName = 'nobody';
    var displayRole = '權限: '
    var publish = 0;
    var concern = 0;
    var complete = 0;
    var officeLocation = constant.addressNotSet;
    var homeLocation = constant.addressNotSet;
    let dialogHtml = null;
    if (this.state.user != null) {
        imgURL = this.state.userProfile.photoURL;
        this.path = "UserProfile/" + this.state.user.uid + "/";
        displayName = this.state.userProfile.displayName;
        displayRole += this.state.userProfile.role;
        if(this.state.userProfile != null)
        {
          if(this.state.userProfile.publishMessages != null)
          {
            publish = this.state.userProfile.publishMessages.length;
          }
          if(this.state.userProfile.completeMessages != null)
          {
            complete = this.state.userProfile.completeMessages.length;
          }
          if(this.state.userProfile.concernMessages != null)
          {
            concern = this.state.userProfile.concernMessages.length;
          }                
        }
    }
    return (
      <Dialog fullScreen  open={this.state.open} onRequestClose={this.handleRequestClose} transition={Transition}>
        <AppBar className={classes.appBar}>
          <Toolbar>
            <IconButton color="contrast" onClick={this.handleRequestClose} aria-label="Close">
              <CloseIcon />
            </IconButton>
            <Typography variant="title" color="inherit" className={classes.flex}>
              <img src={imgURL} style={{height:"20px", width:"20px"}}/>&nbsp;&nbsp;{displayName}
            </Typography>           
            <Button color="contrast" onClick={() => this.onSubmit()}>
              save
            </Button>
          </Toolbar>
        </AppBar>

        <FormGroup>  
          <br/>
          <UploadImageButton ref={(uploadImageButton) => {this.uploadImageButton = uploadImageButton;}} thumbnailFilename={this.thumbnailFilename} isThumbnailOnly={true} path={this.path} uploadFinish={(imageURL, publicImageURL, thumbnailImageURL, thumbnailPublicImageURL) => {this.uploadFinish(imageURL, publicImageURL, thumbnailImageURL, thumbnailPublicImageURL);}}/>
        </FormGroup>
       
        <List>
          <ListItem >
            <ListItemText primary={displayRole} />
          </ListItem>          
          <ListItem button>
            <ListItemText primary="發表事件: " secondary={publish} />
          </ListItem>            
          <ListItem button>
            <ListItemText primary="關注事件: " secondary={concern} />
          </ListItem>                        
          <ListItem button>
            <ListItemText primary="完成事件: " secondary={complete} />
          </ListItem>                                   
        </List>
        </Dialog>
    );
  }
}

UserProfileView.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(UserProfileView);

