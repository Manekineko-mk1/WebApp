import React, { Component } from 'react';
import AddressView from './AddressView';
import { fetchAddressBookByUser, fetchAddressBookFromOurLand } from '../actions';
import {connect} from "react-redux";


class AddressList extends Component {
  componentWillMount() {
    this.props.fetchAddressBookByUser(this.props.user.user);
    this.props.fetchAddressBookFromOurLand();
  }
  
  render() {
    let elements = null;
    const { addressBook } = this.props;
    elements = addressBook.addresses.map((address, idx) => {
        return (<AddressView idx={idx} address={address} OnChange={() => {this.componentWillMount()}}/>);
      });      
    return (<div width="100%" >{elements}</div>);
  }
};


const mapStateToProps = (state, ownProps) => {
  return {
    user: state.user,
    addressBook: state.addressBook,
  };
}

const mapDispatchToProps = (dispatch) => {
  return {
    fetchAddressBookFromOurLand:
      () => dispatch(fetchAddressBookFromOurLand()),    
    fetchAddressBookByUser:
      user =>
        dispatch(fetchAddressBookByUser(user)),
  }
};


export default connect(mapStateToProps,mapDispatchToProps)(AddressList);
