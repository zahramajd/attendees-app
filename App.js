import React, { Component } from 'react'
import {
  Alert,
  Linking,
  Dimensions,
  LayoutAnimation,
  Text,
  View,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Button
} from 'react-native'
import { BarCodeScanner, Permissions } from 'expo'
import axios from 'axios'

export default class App extends Component {
  state = {
    hasCameraPermission: null,
    lastScannedUrl: null,
    loggedIn: false,
    username: null,
    password: null,
    token: null
  };

  componentDidMount() {
    this._requestCameraPermission();
  }

  _requestCameraPermission = async () => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({
      hasCameraPermission: status === 'granted',
    });
  };

  _handleBarCodeRead = result => {
    if (result.data !== this.state.lastScannedUrl) {
      LayoutAnimation.spring();
      this.setState({ lastScannedUrl: result.data });

      // Parse data
      const token = JSON.parse(result.data)
      axios.post('http://172.25.136.135:3000/api/otp/verify', {
        otp: token,
        username: this.state.username
      }).then(function (response) {
        console.log(response);
      })
        .catch(function (error) {
          console.log(error);
        })
    }
  };

  _handleButtonPress = async () => {
    try {
      const res = await axios.post('http://172.25.136.135:3000/api/login', {
        username: this.state.username,
        password: this.state.password
      })

      const token = res.headers['set-cookie']
        .split(';')
        .map(s => s.split('='))
        .find(p => p[0] == 'connect.sid')[1]

      axios.defaults.headers.common['Cookie'] = 'connect.sid=' + token
      this.setState({ token })
    }
    catch (err) {
      console.log(err)
      Alert.alert(
        'خطای ورود',
        'شناسه کاربری یا رمز عبور اشتباه است'
      )
    }
  }

  render() {
    if (!this.state.token) {
      return (<View>
        <TextInput
          onChangeText={username => this.setState({ username })}
          style={{
            width: 200, height: 44, padding: 8, borderColor: 'gray', borderWidth: 1, marginTop: 80, marginLeft: 50
          }}
        />
        <TextInput
          value={this.state.inputValue}
          onChangeText={password => this.setState({ password })}
          style={{
            width: 200, height: 44, padding: 8, borderColor: 'gray', borderWidth: 3, marginTop: 4, marginLeft: 50
          }}
        />
        <Button
          title="Log in"
          onPress={() => this._handleButtonPress()}
        />
      </View>
      )
    }

    return (
      <View style={styles.container}>

        {this.state.hasCameraPermission === null
          ? <Text>Requesting for camera permission</Text>
          : this.state.hasCameraPermission === false
            ? <Text style={{ color: '#fff' }}>
              Camera permission is not granted
                </Text>
            : <BarCodeScanner
              onBarCodeRead={result => this._handleBarCodeRead(result)}
              style={{
                height: Dimensions.get('window').height,
                width: Dimensions.get('window').width,
              }}
            />}

        {this._maybeRenderUrl()}

        <StatusBar hidden />
      </View>
    );
  }

  _handlePressUrl = () => {
    Alert.alert(
      'Open this URL?',
      this.state.lastScannedUrl,
      [
        {
          text: 'Yes',
          onPress: () => Linking.openURL(this.state.lastScannedUrl),
        },
        { text: 'No', onPress: () => { } },
      ],
      { cancellable: false }
    );
  };

  _handlePressCancel = () => {
    this.setState({ lastScannedUrl: null });
  };

  _maybeRenderUrl = () => {
    if (!this.state.lastScannedUrl) {
      return;
    }

    return (
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.url} onPress={this._handlePressUrl}>
          <Text numberOfLines={1} style={styles.urlText}>
            {this.state.lastScannedUrl}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={this._handlePressCancel}>
          <Text style={styles.cancelButtonText}>
            Cancel
          </Text>
        </TouchableOpacity>
      </View>
    );
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 15,
    flexDirection: 'row',
  },
  url: {
    flex: 1,
  },
  urlText: {
    color: '#fff',
    fontSize: 20,
  },
  cancelButton: {
    marginLeft: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 18,
  },
  inputView: {
    borderBottomColor: '#fff',
    borderBottomWidth: 0.5,
  }
});