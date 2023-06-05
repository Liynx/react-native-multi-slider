import React, { createRef } from 'react';

import {
  StyleSheet,
  PanResponder,
  View,
  Platform,
  Dimensions,
  I18nManager,
  ImageBackground,
  TouchableOpacity,
} from 'react-native';

import DefaultMarker from './DefaultMarker';
import DefaultLabel from './DefaultLabel';
import { createArray, valueToPosition, positionToValue } from './converters';

export default class MultiSlider extends React.Component {
  static defaultProps = {
    values: [0],
    values2: [0],
    values3: [0],

    // On change hook for first slider
    onValuesChangeStart: () => {},
    onValuesChange: values => {},
    onValuesChangeFinish: values => {},
    onMarkersPosition: values => {},
    // On change hooks for second slider
    onValues2ChangeStart: () => {},
    onValues2Change: values => {},
    onValues2ChangeFinish: values => {},
    onMarkers2Position: values => {},
    // On change hooks for third slider
    onValues3ChangeStart: () => {},
    onValues3Change: values => {},
    onValues3ChangeFinish: values => {},
    onMarkers3Position: values => {},

    // hook for adding a slider with values
    onAddSlider: value => {},

    step: 1,
    min: 0,
    max: 10,
    touchDimensions: {
      height: 50,
      width: 50,
      borderRadius: 15,
      slipDisplacement: 200,
    },
    customMarker: DefaultMarker,
    customMarkerLeft: DefaultMarker,
    customMarkerRight: DefaultMarker,
    customLabel: DefaultLabel,
    markerOffsetX: 0,
    markerOffsetY: 0,
    sliderLength: 280,
    onToggleOne: undefined,
    onToggleTwo: undefined,
    // Enable first slider (uses default props)
    enabledOne: true,
    enabledTwo: true,
    // Enable second slider (uses default props)
    enabled2One: true,
    enabled2Two: true,
    // Enable third slider 
    enabled3One: true,
    enabled3Two: true,

    allowOverlap: false,
    snapped: false,
    vertical: false,
    minMarkerOverlapDistance: 0,
    secondSet: false,

    firstSlider: false,
    secondSlider: false,
    thirdSlider: false
  };

  constructor(props) {
    super(props);

    this.optionsArray =
      this.props.optionsArray ||
      createArray(this.props.min, this.props.max, this.props.step);
    this.stepLength = this.props.sliderLength / this.optionsArray.length;

    var initialValues = this.props.values.map(value =>
      valueToPosition(value, this.optionsArray, this.props.sliderLength),
    );
    
    var initialValues2 = this.props.values2.map(value => 
      valueToPosition(value, this.optionsArray, this.props.sliderLength)  
    )

    var initialValues3 = this.props.values3.map(value => 
      valueToPosition(value, this.optionsArray, this.props.sliderLength)  
    )

    this.state = {
      // initial state
      pressedOne: true,
      valueOne: this.props.values[0],
      valueTwo: this.props.values[1],
      pastOne: initialValues[0],
      pastTwo: initialValues[1],
      positionOne: initialValues[0],
      positionTwo: initialValues[1],
      // second scroller attempt
      value2One: this.props.values2[0],
      value2Two: this.props.values2[1],
      past2One: initialValues2[0],
      past2Two: initialValues2[1],
      position2One: initialValues2[0],
      position2Two: initialValues2[1],
      // Third slider
      value3One: this.props.values3[0],
      value3Two: this.props.values3[1],
      past3One: initialValues3[0],
      past3Two: initialValues3[1],
      position3One: initialValues3[0],
      position3Two: initialValues3[1],
    };
    this.subscribePanResponder();
  }
  

  subscribePanResponder = () => {
    var customPanResponder = (start, move, end) => {
      return PanResponder.create({
        onStartShouldSetPanResponder: (evt, gestureState) => true,
        onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
        onMoveShouldSetPanResponder: (evt, gestureState) => true,
        onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
        onPanResponderGrant: (evt, gestureState) => start(),
        onPanResponderMove: (evt, gestureState) => move(gestureState),
        onPanResponderTerminationRequest: (evt, gestureState) => false,
        onPanResponderRelease: (evt, gestureState) => end(gestureState),
        onPanResponderTerminate: (evt, gestureState) => end(gestureState),
        onShouldBlockNativeResponder: (evt, gestureState) => true,
      });
    };

    this._panResponderBetween = customPanResponder(
      gestureState => {
        this.startOne(gestureState);
        this.startTwo(gestureState);
      },
      gestureState => {
        this.moveOne(gestureState);
        this.moveTwo(gestureState);
      },
      gestureState => {
        this.endOne(gestureState);
        this.endTwo(gestureState);
      },
    );

    this._panResponderOne = customPanResponder(
      this.startOne,
      this.moveOne,
      this.endOne,
    );
    this._panResponderTwo = customPanResponder(
      this.startTwo,
      this.moveTwo,
      this.endTwo,
    );

    this._panResponder2One = customPanResponder(
      this.start2One,
      this.move2One,
      this.end2One
    )
    this._panResponder2Two = customPanResponder(
      this.start2Two,
      this.move2Two,
      this.end2Two
    )

    this._panResponder3One = customPanResponder(
      this.start3One,
      this.move3One,
      this.end3One
    )
    this._panResponder3Two = customPanResponder(
      this.start3Two,
      this.move3Two,
      this.end3Two
    )
  };

  startOne = () => {
    if (this.props.enabledOne) {
      this.props.onValuesChangeStart();
      this.setState({
        onePressed: !this.state.onePressed,
      });
    }
  };


  startTwo = () => {
    if (this.props.enabledTwo) {
      this.props.onValuesChangeStart();
      this.setState({
        twoPressed: !this.state.twoPressed,
      });
    }
  };

  moveOne = gestureState => {
    if (!this.props.enabledOne) {
      return;
    }

    const accumDistance = this.props.vertical
      ? -gestureState.dy
      : gestureState.dx;
    const accumDistanceDisplacement = this.props.vertical
      ? gestureState.dx
      : gestureState.dy;

    const unconfined = I18nManager.isRTL
      ? this.state.pastOne - accumDistance
      : accumDistance + this.state.pastOne;
    var bottom = 0;
    var trueTop =
      this.state.positionTwo -
      (this.props.allowOverlap
        ? 0
        : this.props.minMarkerOverlapDistance > 0
        ? this.props.minMarkerOverlapDistance
        : this.stepLength);
    var top = trueTop === 0 ? 0 : trueTop || this.props.sliderLength;
    var confined =
      unconfined < bottom ? bottom : unconfined > top ? top : unconfined;
    var slipDisplacement = this.props.touchDimensions.slipDisplacement;

    if (
      Math.abs(accumDistanceDisplacement) < slipDisplacement ||
      !slipDisplacement
    ) {
      var value = positionToValue(
        confined,
        this.optionsArray,
        this.props.sliderLength,
      );
      var snapped = valueToPosition(
        value,
        this.optionsArray,
        this.props.sliderLength,
      );
      this.setState({
        positionOne: this.props.snapped ? snapped : confined,
      });

      if (value !== this.state.valueOne) {        
        this.setState(
          {
            valueOne: value,
          },
          () => {
            var change = [this.state.valueOne];
            if (this.state.valueTwo) {
              change.push(this.state.valueTwo);
            }
            this.props.onValuesChange(change);

            this.props.onMarkersPosition([
              this.state.positionOne,
              this.state.positionTwo,
            ]);
          },
        );
      }
    }
  };

  moveTwo = gestureState => {
    if (!this.props.enabledTwo) {
      return;
    }

    const accumDistance = this.props.vertical
      ? -gestureState.dy
      : gestureState.dx;
    const accumDistanceDisplacement = this.props.vertical
      ? gestureState.dx
      : gestureState.dy;

    const unconfined = I18nManager.isRTL
      ? this.state.pastTwo - accumDistance
      : accumDistance + this.state.pastTwo;
    var bottom =
      this.state.positionOne +
      (this.props.allowOverlap
        ? 0
        : this.props.minMarkerOverlapDistance > 0
        ? this.props.minMarkerOverlapDistance
        : this.stepLength);
    var top = this.props.sliderLength;
    var confined =
      unconfined < bottom ? bottom : unconfined > top ? top : unconfined;
    var slipDisplacement = this.props.touchDimensions.slipDisplacement;

    if (
      Math.abs(accumDistanceDisplacement) < slipDisplacement ||
      !slipDisplacement
    ) {
      var value = positionToValue(
        confined,
        this.optionsArray,
        this.props.sliderLength,
      );
      var snapped = valueToPosition(
        value,
        this.optionsArray,
        this.props.sliderLength,
      );

      this.setState({
        positionTwo: this.props.snapped ? snapped : confined,
      });

      if (value !== this.state.valueTwo) {
        this.setState(
          {
            valueTwo: value,
          },
          () => {
            this.props.onValuesChange([
              this.state.valueOne,
              this.state.valueTwo,
            ]);

            this.props.onMarkersPosition([
              this.state.positionOne,
              this.state.positionTwo,
            ]);
          },
        );
      }
    }
  };

  endOne = gestureState => {
    if (gestureState.moveX === 0 && this.props.onToggleOne) {
      this.props.onToggleOne();
      return;
    }

    this.setState(
      {
        pastOne: this.state.positionOne,
        onePressed: !this.state.onePressed,
      },
      () => {
        var change = [this.state.valueOne];
        if (this.state.valueTwo) {
          change.push(this.state.valueTwo);
        }
        this.props.onValuesChangeFinish(change);
      },
    );
  };

  endTwo = gestureState => {
    if (gestureState.moveX === 0 && this.props.onToggleTwo) {
      this.props.onToggleTwo();
      return;
    }

    this.setState(
      {
        twoPressed: !this.state.twoPressed,
        pastTwo: this.state.positionTwo,
      },
      () => {
        this.props.onValuesChangeFinish([
          this.state.valueOne,
          this.state.valueTwo,
        ]);
      },
    );
  };

  // second set of panhandlers

  start2One = () => {
    if (this.props.enabled2One) {
      this.props.onValues2ChangeStart();
      this.setState({
        one2Pressed: !this.state.one2Pressed,
      });
    }
  };

  move2One = gestureState => {
    if (!this.props.enabled2One) {
      return;
    }

    const accumDistance = this.props.vertical
      ? -gestureState.dy
      : gestureState.dx;
    const accumDistanceDisplacement = this.props.vertical
      ? gestureState.dx
      : gestureState.dy;

    const unconfined = I18nManager.isRTL
      ? this.state.past2One - accumDistance
      : accumDistance + this.state.past2One;
    var bottom = 0;
    var trueTop =
      this.state.position2Two -
      (this.props.allowOverlap
        ? 0
        : this.props.minMarkerOverlapDistance > 0
        ? this.props.minMarkerOverlapDistance
        : this.stepLength);
    var top = trueTop === 0 ? 0 : trueTop || this.props.sliderLength;
    var confined =
      unconfined < bottom ? bottom : unconfined > top ? top : unconfined;
    var slipDisplacement = this.props.touchDimensions.slipDisplacement;

    if (
      Math.abs(accumDistanceDisplacement) < slipDisplacement ||
      !slipDisplacement
    ) {
      var value = positionToValue(
        confined,
        this.optionsArray,
        this.props.sliderLength,
      );
      var snapped = valueToPosition(
        value,
        this.optionsArray,
        this.props.sliderLength,
      );
      this.setState({
        position2One: this.props.snapped ? snapped : confined,
      });
      if (value !== this.state.value2One) {
        this.setState(
          {
            value2One: value,
          },
          () => {
            var change = [this.state.value2One];
            if (this.state.value2Two) {
              change.push(this.state.value2Two);
            }
            this.props.onValues2Change(change);

            this.props.onMarkers2Position([
              this.state.position2One,
              this.state.position2Two,
            ]);
          },
        );
      }
    }
  };

  end2One = gestureState => {
    if (gestureState.moveX === 0 && this.props.onToggle2One) {
      this.props.onToggle2One();
      return;
    }

    this.setState(
      {
        past2One: this.state.position2One,
        one2Pressed: !this.state.one2Pressed,
      },
      () => {
        var change = [this.state.value2One];
        if (this.state.value2Two) {
          change.push(this.state.value2Two);
        }
        this.props.onValues2ChangeFinish(change);
      },
    );
  };

  start2Two = () => {
    if (this.props.enabled2Two) {
      this.props.onValues2ChangeStart();
      this.setState({
        two2Pressed: !this.state.two2Pressed,
      });
    }
  };

  move2Two = gestureState => {
    if (!this.props.enabled2Two) {
      return;
    }

    const accumDistance = this.props.vertical
      ? -gestureState.dy
      : gestureState.dx;
    const accumDistanceDisplacement = this.props.vertical
      ? gestureState.dx
      : gestureState.dy;

    const unconfined = I18nManager.isRTL
      ? this.state.past2Two - accumDistance
      : accumDistance + this.state.past2Two;
    var bottom =
      this.state.position2One +
      (this.props.allowOverlap
        ? 0
        : this.props.minMarkerOverlapDistance > 0
        ? this.props.minMarkerOverlapDistance
        : this.stepLength);
    var top = this.props.sliderLength;
    var confined =
      unconfined < bottom ? bottom : unconfined > top ? top : unconfined;
    var slipDisplacement = this.props.touchDimensions.slipDisplacement;

    if (
      Math.abs(accumDistanceDisplacement) < slipDisplacement ||
      !slipDisplacement
    ) {
      var value = positionToValue(
        confined,
        this.optionsArray,
        this.props.sliderLength,
      );
      var snapped = valueToPosition(
        value,
        this.optionsArray,
        this.props.sliderLength,
      );

      this.setState({
        position2Two: this.props.snapped ? snapped : confined,
      });

      if (value !== this.state.value2Two) {
        this.setState(
          {
            value2Two: value,
          },
          () => {
            this.props.onValues2Change([
              this.state.value2One,
              this.state.value2Two,
            ]);

            this.props.onMarkers2Position([
              this.state.position2One,
              this.state.position2Two,
            ]);
          },
        );
      }
    }
  };

  end2Two = gestureState => {
    if (gestureState.moveX === 0 && this.props.onToggle2Two) {
      this.props.onToggle2Two();
      return;
    }

    this.setState(
      {
        twoPressed: !this.state.two2Pressed,
        pastTwo: this.state.position2Two,
      },
      () => {
        this.props.onValues2ChangeFinish([
          this.state.value2One,
          this.state.value2Two,
        ]);
      },
    );
  };

  // third set of panhandlers

  start3One = () => {
    if (this.props.enabled3One) {
      this.props.onValues3ChangeStart();
      this.setState({
        one3Pressed: !this.state.one3Pressed,
      });
    }
  };

  move3One = gestureState => {
    if (!this.props.enabled3One) {
      return;
    }

    const accumDistance = this.props.vertical
      ? -gestureState.dy
      : gestureState.dx;
    const accumDistanceDisplacement = this.props.vertical
      ? gestureState.dx
      : gestureState.dy;

    const unconfined = I18nManager.isRTL
      ? this.state.past3One - accumDistance
      : accumDistance + this.state.past3One;
    var bottom = 0;
    var trueTop =
      this.state.position3Two -
      (this.props.allowOverlap
        ? 0
        : this.props.minMarkerOverlapDistance > 0
        ? this.props.minMarkerOverlapDistance
        : this.stepLength);
    var top = trueTop === 0 ? 0 : trueTop || this.props.sliderLength;
    var confined =
      unconfined < bottom ? bottom : unconfined > top ? top : unconfined;
    var slipDisplacement = this.props.touchDimensions.slipDisplacement;

    if (
      Math.abs(accumDistanceDisplacement) < slipDisplacement ||
      !slipDisplacement
    ) {
      var value = positionToValue(
        confined,
        this.optionsArray,
        this.props.sliderLength,
      );
      var snapped = valueToPosition(
        value,
        this.optionsArray,
        this.props.sliderLength,
      );
      this.setState({
        position3One: this.props.snapped ? snapped : confined,
      });
      if (value !== this.state.value3One) {
        this.setState(
          {
            value3One: value,
          },
          () => {
            var change = [this.state.value3One];
            if (this.state.value3Two) {
              change.push(this.state.value3Two);
            }
            this.props.onValues3Change(change);

            this.props.onMarkers3Position([
              this.state.position3One,
              this.state.position3Two,
            ]);
          },
        );
      }
    }
  };

  end3One = gestureState => {
    if (gestureState.moveX === 0 && this.props.onToggle3One) {
      this.props.onToggle3One();
      return;
    }

    this.setState(
      {
        past3One: this.state.position3One,
        one3Pressed: !this.state.one3Pressed,
      },
      () => {
        var change = [this.state.value3One];
        if (this.state.value3Two) {
          change.push(this.state.value3Two);
        }
        this.props.onValues3ChangeFinish(change);
      },
    );
  };

  start3Two = () => {
    if (this.props.enabled3Two) {
      this.props.onValues3ChangeStart();
      this.setState({
        two3Pressed: !this.state.two3Pressed,
      });
    }
  };

  move3Two = gestureState => {
    if (!this.props.enabled3Two) {
      return;
    }

    const accumDistance = this.props.vertical
      ? -gestureState.dy
      : gestureState.dx;
    const accumDistanceDisplacement = this.props.vertical
      ? gestureState.dx
      : gestureState.dy;

    const unconfined = I18nManager.isRTL
      ? this.state.past3Two - accumDistance
      : accumDistance + this.state.past3Two;
    var bottom =
      this.state.position3One +
      (this.props.allowOverlap
        ? 0
        : this.props.minMarkerOverlapDistance > 0
        ? this.props.minMarkerOverlapDistance
        : this.stepLength);
    var top = this.props.sliderLength;
    var confined =
      unconfined < bottom ? bottom : unconfined > top ? top : unconfined;
    var slipDisplacement = this.props.touchDimensions.slipDisplacement;

    if (
      Math.abs(accumDistanceDisplacement) < slipDisplacement ||
      !slipDisplacement
    ) {
      var value = positionToValue(
        confined,
        this.optionsArray,
        this.props.sliderLength,
      );
      var snapped = valueToPosition(
        value,
        this.optionsArray,
        this.props.sliderLength,
      );

      this.setState({
        position3Two: this.props.snapped ? snapped : confined,
      });

      if (value !== this.state.value3Two) {
        this.setState(
          {
            value3Two: value,
          },
          () => {
            this.props.onValues3Change([
              this.state.value3One,
              this.state.value3Two,
            ]);

            this.props.onMarkers3Position([
              this.state.position3One,
              this.state.position3Two,
            ]);
          },
        );
      }
    }
  };

  end3Two = gestureState => {
    if (gestureState.moveX === 0 && this.props.onToggle3Two) {
      this.props.onToggle3Two();
      return;
    }

    this.setState(
      {
        twoPressed: !this.state.two3Pressed,
        pastTwo: this.state.position3Two,
      },
      () => {
        this.props.onValues3ChangeFinish([
          this.state.value3One,
          this.state.value3Two,
        ]);
      },
    );
  };

  onPress = (evt) => {
    let value = positionToValue(
      evt.nativeEvent.locationX,
      this.optionsArray,
      this.props.sliderLength,
    )
    if (!this.props.secondSlider) {
      this.props.onAddSlider(value)
    }

  }



  componentDidUpdate(prevProps, prevState) {
    const {
      positionOne: prevPositionOne,
      positionTwo: prevPositionTwo,
    } = prevState;

    const { positionOne, positionTwo } = this.state;

    if (
      typeof positionOne === 'undefined' &&
      typeof positionTwo !== 'undefined'
    ) {
      return;
    }

    if (positionOne !== prevPositionOne || positionTwo !== prevPositionTwo) {
      this.props.onMarkersPosition([positionOne, positionTwo]);
    }

    if (this.state.onePressed || this.state.twoPressed) {
      return;
    }

    let nextState = {};
    if (
      prevProps.min !== this.props.min ||
      prevProps.max !== this.props.max ||
      prevProps.step !== this.props.step ||
      prevProps.values[0] !== this.props.values[0] ||
      prevProps.sliderLength !== this.props.sliderLength ||
      prevProps.values[1] !== this.props.values[1] ||
      (prevProps.sliderLength !== this.props.sliderLength &&
        prevProps.values[1])
    ) {
      this.optionsArray =
        this.props.optionsArray ||
        createArray(this.props.min, this.props.max, this.props.step);

      this.stepLength = this.props.sliderLength / this.optionsArray.length;

      const positionOne = valueToPosition(
        this.props.values[0],
        this.optionsArray,
        this.props.sliderLength,
      );
      nextState.valueOne = this.props.values[0];
      nextState.pastOne = positionOne;
      nextState.positionOne = positionOne;

      const positionTwo = valueToPosition(
        this.props.values[1],
        this.optionsArray,
        this.props.sliderLength,
      );
      nextState.valueTwo = this.props.values[1];
      nextState.pastTwo = positionTwo;
      nextState.positionTwo = positionTwo;

      //slider 2 positions
      const position2One = valueToPosition(
        this.props.values2[0],
        this.optionsArray,
        this.props.sliderLength
      )
      nextState.value2One = this.props.values2[0]
      nextState.past2One = position2One
      nextState.position2One = position2One

      const position2Two = valueToPosition(
        this.props.values2[1],
        this.optionsArray,
        this.props.sliderLength
      )
      nextState.value2Two = this.props.values2[1]
      nextState.past2Two = position2Two
      nextState.position2Two = position2Two

        //slider 3 positions
      const position3One = valueToPosition(
        this.props.values3[0],
        this.optionsArray,
        this.props.sliderLength
      )
      nextState.value3One = this.props.values3[0]
      nextState.past3One = position3One
      nextState.position3One = position3One

      const position3Two = valueToPosition(
        this.props.values3[1],
        this.optionsArray,
        this.props.sliderLength
      )
      nextState.value3Two = this.props.values3[1]
      nextState.past3Two = position3Two
      nextState.position3Two = position3Two

      this.setState(nextState);
    }
  }

  render() {
    const { positionOne, positionTwo, position2One, position2Two, position3One, position3Two } = this.state;
    const {
      selectedStyle,
      unselectedStyle,
      sliderLength,
      markerOffsetX,
      markerOffsetY,
    } = this.props;
    const twoMarkers = this.props.values.length == 2; // when allowOverlap, positionTwo could be 0, identified as string '0' and throwing 'RawText 0 needs to be wrapped in <Text>' error
    const trackOneLength = positionOne;

    const trackOneStyle = twoMarkers
      ? unselectedStyle
      : selectedStyle || styles.selectedTrack;
    const trackThreeLength = twoMarkers ? sliderLength - positionTwo : 0;
    const trackThreeStyle = unselectedStyle;
    const trackTwoLength = sliderLength - trackOneLength - trackThreeLength;
    const trackTwoStyle = twoMarkers
      ? selectedStyle || styles.selectedTrack
      : unselectedStyle;
    const Marker = this.props.customMarker;

    // Second set -----
    const track2OneLength = position2One;
    const track2ThreeLength = twoMarkers ? sliderLength - position2Two : 0;
    const track2TwoLength = sliderLength - track2OneLength - track2ThreeLength;

    // Third set -----
    const track3OneLength = position3One;
    const track3ThreeLength = twoMarkers ? sliderLength - position3Two : 0;
    const track3TwoLength = sliderLength - track3OneLength - track3ThreeLength;

    const {
      borderRadius,
    } = this.props.touchDimensions;
    const touchStyle = {
      borderRadius: borderRadius || 0,
    };

    const markerContainerOne = {
      top: markerOffsetY - 24,
      left: trackOneLength + markerOffsetX - 24,
    };

    const markerContainerTwo = {
      top: markerOffsetY - 24,
      right: trackThreeLength - markerOffsetX - 24,
    };

    const markerConatainer2One = {
      top: markerOffsetY - 24,
      left: track2OneLength + markerOffsetX - 24
    }

    const markerContainer2Two = {
      top: markerOffsetY - 24,
      right: track2ThreeLength - markerOffsetX - 24,
    };

    const markerConatainer3One = {
      top: markerOffsetY - 24,
      left: track3OneLength + markerOffsetX - 24
    }

    const markerContainer3Two = {
      top: markerOffsetY - 24,
      right: track3ThreeLength - markerOffsetX - 24,
    };

    const containerStyle = [styles.container, this.props.containerStyle];

    if (this.props.vertical) {
      containerStyle.push({
        transform: [{ rotate: '-90deg' }],
      });
    }

    const body = (
      <React.Fragment>
        <TouchableOpacity onPress={(evt) => this.onPress(evt)} activeOpacity={1} style={[styles.fullTrack, { width: sliderLength, zIndex: 1 }, this.props.firstSlider ? undefined : {display: 'none'}]}>
          {/*----------- Track for selecting the middle of selected area --------  */}
          <View
            style={[
              styles.track,
              this.props.trackStyle,
              trackOneStyle,
              { width: trackOneLength, borderTopLeftRadius: 20, borderBottomLeftRadius: 20 },
            ]}
          />
          {/* Track for selecting ends of the selected area (holds) */}
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.track,
              this.props.trackStyle,
              trackTwoStyle,
              { width: trackTwoLength },
            ]}
            // {...(twoMarkers ? this._panResponderBetween.panHandlers : {})}
          />
          {this.props.firstSlider ? (
            <>
              {/*--------- First marker for first slider -----------*/}
          <View
            style={[
              styles.markerContainer,
              markerContainerOne,
              this.props.markerContainerStyle,
              positionOne > sliderLength / 2 && styles.topMarkerContainer,
            ]}
          >
            <View
              style={[styles.touch, touchStyle]}
              ref={component => (this._markerOne = component)}
              {...this._panResponderOne.panHandlers}
            >
              <Marker
                enabled={this.props.enabledOne}
                pressed={this.state.onePressed}
                markerStyle={this.props.markerStyle}
                pressedMarkerStyle={this.props.pressedMarkerStyle}
                disabledMarkerStyle={this.props.disabledMarkerStyle}
                currentValue={this.state.valueOne}
                valuePrefix={this.props.valuePrefix}
                valueSuffix={this.props.valueSuffix}
              />
            </View>
          </View>
          
          {/*------- Second marker for first slider ------------*/}
          {twoMarkers && positionOne !== this.props.sliderLength && (
            <View
              style={[
                styles.markerContainer,
                markerContainerTwo,
                this.props.markerContainerStyle
              ]}
            >
              <View
                style={[styles.touch, touchStyle]}
                ref={component => (this._markerTwo = component)}
                {...this._panResponderTwo.panHandlers}
              >
                  <Marker
                    pressed={this.state.twoPressed}
                    markerStyle={this.props.markerStyle}
                    pressedMarkerStyle={this.props.pressedMarkerStyle}
                    disabledMarkerStyle={this.props.disabledMarkerStyle}
                    currentValue={this.state.valueTwo}
                    enabled={this.props.enabledTwo}
                    valuePrefix={this.props.valuePrefix}
                    valueSuffix={this.props.valueSuffix}
                  />
              </View>
            </View>
          )}
            </>
          ) : undefined}
          
          {/* Second slider */}
          {this.props.secondSlider ? (
            <>
              <View
            style={[
              styles.markerContainer,
              markerConatainer2One,
              this.props.markerContainerStyle,
              // positionOne > sliderLength / 2 && styles.topMarkerContainer,
            ]}
          >
            <View
              style={[styles.touch, touchStyle]}
              ref={component => (this._marker2One = component)}
              {...this._panResponder2One.panHandlers}
            >
              <Marker
                enabled={this.props.enabled2One}
                pressed={this.state.onePressed}
                markerStyle={this.props.markerStyle}
                pressedMarkerStyle={this.props.pressedMarkerStyle}
                disabledMarkerStyle={this.props.disabledMarkerStyle}
                currentValue={this.state.value2One}
                valuePrefix={this.props.valuePrefix}
                valueSuffix={this.props.valueSuffix}
              />
            </View>
          </View>
          {twoMarkers && position2One !== this.props.sliderLength && (
            <View
              style={[
                styles.markerContainer,
                markerContainer2Two,
                this.props.markerContainerStyle
              ]}
            >
              <View
                style={[styles.touch, touchStyle]}
                ref={component => (this._marker2Two = component)}
                {...this._panResponder2Two.panHandlers}
              >
                  <Marker
                    pressed={this.state.two2Pressed}
                    markerStyle={this.props.markerStyle}
                    pressedMarkerStyle={this.props.pressedMarkerStyle}
                    disabledMarkerStyle={this.props.disabledMarkerStyle}
                    currentValue={this.state.value2Two}
                    enabled={this.props.enabled2Two}
                    valuePrefix={this.props.valuePrefix}
                    valueSuffix={this.props.valueSuffix}
                  />
              </View>
            </View>
          )}
            </>
          ) : undefined}
          {console.log(this.props.thirdSlider)}
          {/* third slider */}
          {this.props.thirdSlider ? (
            <>
              <View
            style={[
              styles.markerContainer,
              markerConatainer3One,
              this.props.markerContainerStyle,
              // positionOne > sliderLength / 2 && styles.topMarkerContainer,
            ]}
          >
            <View
              style={[styles.touch, touchStyle]}
              ref={component => (this._marker3One = component)}
              {...this._panResponder3One.panHandlers}
            >
              <Marker
                enabled={this.props.enabled3One}
                pressed={this.state.onePressed}
                markerStyle={this.props.markerStyle}
                pressedMarkerStyle={this.props.pressedMarkerStyle}
                disabledMarkerStyle={this.props.disabledMarkerStyle}
                currentValue={this.state.value3One}
                valuePrefix={this.props.valuePrefix}
                valueSuffix={this.props.valueSuffix}
              />
            </View>
          </View>
          {twoMarkers && position3One !== this.props.sliderLength && (
            <View
              style={[
                styles.markerContainer,
                markerContainer3Two,
                this.props.markerContainerStyle
              ]}
            >
              <View
                style={[styles.touch, touchStyle]}
                ref={component => (this._marker3Two = component)}
                {...this._panResponder3Two.panHandlers}
              >
                  <Marker
                    pressed={this.state.two3Pressed}
                    markerStyle={this.props.markerStyle}
                    pressedMarkerStyle={this.props.pressedMarkerStyle}
                    disabledMarkerStyle={this.props.disabledMarkerStyle}
                    currentValue={this.state.value3Two}
                    enabled={this.props.enabled3Two}
                    valuePrefix={this.props.valuePrefix}
                    valueSuffix={this.props.valueSuffix}
                  />
              </View>
            </View>
          )}
            </>
          ) : undefined}
          
        </TouchableOpacity>
      </React.Fragment>
    );
    return (
      <View>
        {!this.props.imageBackgroundSource && (
          <View style={containerStyle}>{body}</View>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    height: 50,
    justifyContent: 'center',
  },
  fullTrack: {
    flexDirection: 'row',
  },
  track: {
    backgroundColor: 'transparent'
  },
  selectedTrack: {
    backgroundColor: 'transparent'
  },
  markerContainer: {
    position: 'absolute',
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topMarkerContainer: {
    zIndex: 1,
  },
  touch: {
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
});