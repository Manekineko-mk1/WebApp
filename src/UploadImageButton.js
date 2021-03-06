import React, { Component } from 'react';
import firebase from 'firebase/app';
import 'firebase/storage';
import config from './config/default';
import { Label } from 'reactstrap';
import Button  from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import { withStyles } from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import PhotoCamera from '@material-ui/icons/PhotoCamera';
import imageResizer from './ImageResizer';
import Snackbar from '@material-ui/core/Snackbar';

const styles = theme => ({
    hidden: {
      display: 'none',
    },
    dialogTitle: {
      background: 'linear-gradient(to bottom, #006fbf  50%, #014880 50%)',
    },
    previewThumbnail: {
      width: '128px',
      height: '128px'
    },
    snackbar: {
      position: 'absolute',
    },
    snackbarContent: {
      width: 360,
    },    
  });



function uploadImage(path, filename, blob) {
  var filePath = config.photoDB + '/' + path+ '/' + filename;
  var storage = firebase.storage();
  return storage.ref(filePath).put(blob);
};



class UploadImageButton extends Component {
  constructor(props) {
    super(props);
    this.imageURL = null;
    this.publicImageURL = null;
    this.thumbnailImageURL = null;
    this.publicThumbnailImagURL = null;
    this.imageUrlRef = null;
    this.thumbnailImageURLRef = null;
    this.thumbnailFile = null;
    this.state = {
        disableSumbit: true,
        disableDelete: true,
        open: false,
        publicThumbnailImagURL: null
    };
    this.pushOriginal = this.pushOriginal.bind(this);
    this.pushThumbnail = this.pushThumbnail.bind(this);
    this.onDelete = this.onDelete.bind(this);
    this.defaultOriginal = "original.jpg";
    this.defaultThumbnail = "thumbnail.jpg";
    this.isOriginalOnly = false;
    this.isThumbnailOnly = false;
    if(this.props.isOriginalOnly === true) {
      this.isOriginalOnly = true;
    }
    if(this.props.isThumbnailOnly === true) {
      this.isThumbnailOnly = true;
    }

  }

  postImage() {
    if (this.validateFile(this.file.files[0])) {
      this.thumbnailFile = this.file.files[0];
        // Upload Event Full Image
        if(this.isThumbnailOnly){
          imageResizer(this.thumbnailFile, 128, 128, "image/jpeg", 0.5, this.pushThumbnail);
        } else {
          imageResizer(this.file.files[0], 1280, 1280, "image/jpeg", 0.5, this.pushOriginal);
        }
    } else  {
        console.log("Not Image/No Image");
        this.imageURL = null;
        this.publicImageURL = null;
        this.thumbnailImageURL = null;
        this.publicThumbnailImagURL = null;
    }
  };

  validateFile(file) {
    if (! file) {
      console.log("file not exist: " + file);
      this.setState({snackMessage: "file not exist: ", snackOpen: true});
      return false;
    }
  
    if(!file.type.match('image.*')) {
      console.log("File is not image:" + file);
      this.setState({snackMessage: 'You can only share images', snackOpen: true});
      return false;
    }
    return true;
  };  

pushOriginal(blob) {
    var file = (this.props.originalFilename==null? this.defaultOriginal: this.props.originalFilename);
    uploadImage(this.props.path, file, blob).then((snapshot) =>  {
        var fullPath = snapshot.metadata.fullPath;
        this.imageUrlRef = firebase.storage().ref(fullPath);
        var firebaseImageURL = firebase.storage().ref(fullPath).toString();
        this.imageURL = firebaseImageURL;
        return this.imageUrlRef.getDownloadURL().then((downloadURL) => {
          return downloadURL;
        }).then((publicImageURL) => {
          console.log(`Upload Thumbnail ${firebaseImageURL} ${publicImageURL}`);
          this.publicImageURL = publicImageURL;
          if(!this.isOriginalOnly){
            imageResizer(this.thumbnailFile, 128, 128, "image/jpeg", 0.5, this.pushThumbnail);
          }else{
            this.setState({publicThumbnailImagURL: this.publicImageURL});
            if(this.props.uploadFinish  != null ) {
              this.props.uploadFinish(this.imageURL, this.publicImageURL, this.thumbnailImageURL, this.publicThumbnailImagURL);
            }
          }
        });
    });
};

  pushThumbnail(blob) {
    var filename = (this.props.thumbnailFilename==null? this.defaultThumbnail: this.props.thumbnailFilename);
    return uploadImage(this.props.path, filename, blob).then((snapshot) =>  {
        var thumbnailFullPath = snapshot.metadata.fullPath;
        this.thumbnailImageURLRef = firebase.storage().ref(thumbnailFullPath);
        var thumbnailFirebaseImageURL = firebase.storage().ref(thumbnailFullPath).toString();
        this.thumbnailImageURL = thumbnailFirebaseImageURL;
        return this.thumbnailImageURLRef.getDownloadURL().then(function(downloadURL) {
          return downloadURL;
        }).then((thumbnailPublicImageURL) => {
          console.log(`Upload Thumbnail ${thumbnailFirebaseImageURL} ${thumbnailPublicImageURL}`);
          this.publicThumbnailImagURL = thumbnailPublicImageURL;
          this.setState({publicThumbnailImagURL: this.publicThumbnailImagURL});
          if(this.props.uploadFinish  != null ) {
              this.props.uploadFinish(this.imageURL, this.publicImageURL, this.thumbnailImageURL, this.publicThumbnailImagURL);
          }
        });
    });
}

  handleClickOpen(){
    if(this.props.path  != null ) {
        this.setState({ open: true, disableSumbit: true});
    }
  };

  onDelete(){
    // delete
    // Delete the file
    if(this.imageUrlRef  != null ) {
      console.log('delete image: '+ this.imageUrlRef);
      this.imageUrlRef.delete();
      this.imageUrlRef = null;
    }
    if(this.thumbnailImageURLRef  != null ) {
      console.log('delete thumbnailImage: '+ this.thumbnailImageURLRef);
      this.thumbnailImageURLRef.delete();
      this.thumbnailImageURLRef = null;
    }
    if(this.props.uploadFinish  != null ) {
      this.props.uploadFinish(null, null, null, null);
    }
    this.setState({ disableSumbit: true, disableDelete: true, publicThumbnailImagURL: null, open: false });
  };

  handleRequestClose(){
    this.setState({ open: false });
  };

  onSubmit(){
    this.setState({ open: false });
    if(this.props.path  != null ) {
        this.postImage();
    }
  };

  handleSnackClose = () => {
    this.setState({ snackOpen: false });
  };

  inputOnchange() {
      if(this.file  != null  && this.file.files[0]  != null  && this.file.files[0] !== "") {
        this.setState({ disableSumbit: false , disableDelete: false});
      } else {
        this.setState({ disableSumbit: true, disableDelete: true});
      }
  }


  render() {
    const { classes} = this.props;
    let thumbnail = "沒有相片";
    if(this.state.publicThumbnailImagURL  != null ) {
      thumbnail = <img src={this.state.publicThumbnailImagURL} className={classes.previewThumbnail} alt="preview"/>
    }
    return (
      <div className="photo-upload-wrapper">
        <Button variant="raised" color="primary" className={classes.uploadButton} raised={true} onClick={() => this.handleClickOpen()}>
            <PhotoCamera />上載相片
        </Button>
        <span class="uploaded-thumbnail">{thumbnail}</span>
        <Dialog
          open={this.state.open}
          onRequestClose={() => this.handleRequestClose()}
          aria-labelledby="form-dialog-title"
        >
            <DialogTitle className={classes.dialogTitle} id="form-dialog-title">上載相片</DialogTitle>
                <DialogContent>
                    <Label for="file">相片</Label>
                        <input
                            accept="image/*"
                            type="file"
                            name="file"
                            id="file"
                            className={classes.hidden}
                            ref={(file) => {this.file = file;}}
                            onChange={() => this.inputOnchange()}
                        />
                    <IconButton color="primary"
                        className={classes.uploadButton}
                        variant="raised"
                        component="label"
                        htmlFor="file"
                    >
                        <PhotoCamera />
                    </IconButton>
                </DialogContent>
            <DialogActions>
                <Button disabled={this.state.disableDelete} color="secondary" onClick={() => this.onDelete()} >刪除</Button>
                <Button color="primary" onClick={() => this.handleRequestClose()} >取消</Button>
                <Button disabled={this.state.disableSumbit} color="primary" onClick={() => this.onSubmit()}>提交</Button>
            </DialogActions>
        </Dialog>
        <Snackbar
              open={this.state.snackOpen}
              autoHideDuration={2000}
              onClose={this.handleSnackClose}
              ContentProps={{
                'aria-describedby': 'snackbar-fab-message-id',
                className: classes.snackbarContent,
              }}
              message={<span id="snackbar-fab-message-id">{this.state.snackMessage}</span>}
              className={classes.snackbar}/>
      </div>);
  }
}

export default withStyles(styles)(UploadImageButton);
