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
} from 'react-native'
import { BarCodeScanner, Permissions, Constants } from 'expo'
import axios from 'axios'
import { Container, Header, Content, Form, Item, Input, Label, Button, Body, Tab, Tabs, Card, List, ListItem } from 'native-base';

const API_URL = 'http://192.168.1.2:4000'

axios.defaults.withCredentials = 'include'

export default class App extends Component {
  state = {
    hasCameraPermission: null,
    lastScannedUrl: null,
    loggedIn: false,
    username: null,
    password: null,
    token: null,
    first_name: null,
    last_name: null,
    sessions: []
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

  _handleBarCodeRead = async result => {
    if (result.data !== this.state.lastScannedUrl) {
      LayoutAnimation.spring();
      this.setState({ lastScannedUrl: result.data });

      // Get deviceID
      // deviceID = Constants.deviceID
      devID = '123456'
      // Parse data
      const token = JSON.parse(result.data)
      let error = null
      try {
        const response = await axios.post(API_URL + '/api/otp/verify', {
          otp: token,
          devID: devID
        })
        console.log(response)
        if (response.data.error) {
          error = response.data.error
        }
      } catch (e) {
        error = e + ''
      }
      if (error) {
        Alert.alert('Error!', error)
      } else {
        Alert.alert('Checked in successfully')
      }
    }
  };

  _handleButtonPress = async () => {
    try {

      const res = await axios.post(API_URL + '/api/login', {
        username: this.state.username,
        password: this.state.password
      })

      const token = res.headers['set-cookie']
        .split(';')
        .map(s => s.split('='))
        .find(p => p[0] == 'connect.sid')[1]
      this.setState({ token })

      this.setState({ first_name: res.data.first_name })
      this.setState({ last_name: res.data.last_name })

      const res_sessions = await axios.get(API_URL + '/api/user/session-of', {
        username: this.state.username,
      })

      this.setState({ sessions: res_sessions.data.sessions })
      console.log(this.state.sessions)
    }
    catch (err) {
      console.log(err)
      Alert.alert(
        'Log in Error',
        'username or password is incorrect'
      )
    }
  }

  render() {
    if (!this.state.token) {
      return (
        <Container>
          <Header />

          <Content>
            <Form>
              <Item floatingLabel >
                <Label>Username</Label>
                <Input onChangeText={username => this.setState({ username })} />
              </Item>
              <Item floatingLabel last secureTextEntry >
                <Label>Password</Label>
                <Input onChangeText={password => this.setState({ password })} />
              </Item>
            </Form>
            <Button full style={{ margin: 20 }} onPress={() => this._handleButtonPress()}><Text> Log in </Text></Button>
          </Content>

        </Container>
      )
    }


    return (
      // <View style={styles.container}>
      <Container>
        <Header hasTabs />
        <Tabs initialPage={1}>
          <Tab heading="Scanner">
            <Content>
              <Card>
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
              </Card>
            </Content>
          </Tab>
          <Tab heading="Profile">
            <List>
              <ListItem >
                <Text>first name: {this.state.first_name}</Text>
              </ListItem>
              <ListItem>
                <Text>last name: {this.state.last_name}</Text>
              </ListItem>
              <ListItem>
                <Text>username: {this.state.username}</Text>
              </ListItem>
            </List>
          </Tab>
          <Tab heading="Courses">
            <List dataArray={this.state.sessions}
              renderRow={(item) =>
                <ListItem>
                  <Text>{item.name}</Text>
                </ListItem>
              }>
            </List>
          </Tab>
        </Tabs>
      </Container>
    )
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