/**
 * MakeRobot
 */
enum MakeRobotMove {
    //% block="left"
    Left,
    //% block="right"
    Right,
    //% block="u-turn"
    UTurn
}

enum MakeRobotLineFollowUntil {
    //% block="cross"
    Cross,
    //% block="obstacle"
    Obstacle
}

enum MakeRobotLinePin {
    //% block="P0"
    P0,
    //% block="P1"
    P1,
    //% block="P2"
    P2
}

enum MakeRobotCalibrationPin {
    //% block="P9"
    P9,
    //% block="P12"
    P12,
    //% block="P13"
    P13,
    //% block="P14"
    P14,
    //% block="P15"
    P15,
    //% block="P16"
    P16
}

enum MakeRobotTurnDirection {
    //% block="left"
    Left,
    //% block="right"
    Right
}

enum MakeRobotLinePosition {
    //% block="center"
    Center,
    //% block="left"
    Left,
    //% block="right"
    Right,
    //% block="far left"
    FarLeft,
    //% block="far right"
    FarRight,
    //% block="all"
    All,
    //% block="none"
    None
}

//% color=#3455db icon="\uf1b9"
//% block="MakeRobot"
//% groups=["Tracer Junior", "Tracer Senior", "Tracer Expert"]
namespace MakeRobot {
    let lastError = 0
    let integral = 0
    let pidSetpoint = 500
    let pidKp = 0.6
    let pidKd = 0.4
    let pidKi = 0
    let leftMotorChannel = MotionBitMotorChannel.M1
    let rightMotorChannel = MotionBitMotorChannel.M3
    let ultrasonicDistance = 255
    let ultrasonicEnabled = false
    let ultrasonicDivisor = control.hardwareVersion() == "1" ? 39 : 58

    control.inBackground(function () {
        while (true) {
            if (ultrasonicEnabled) {
                pins.digitalWritePin(DigitalPin.P1, 0)
                control.waitMicros(2)
                pins.digitalWritePin(DigitalPin.P1, 1)
                control.waitMicros(10)
                pins.digitalWritePin(DigitalPin.P1, 0)

                const pulse = pins.pulseIn(DigitalPin.P2, PulseValue.High, 255 * ultrasonicDivisor + 20000)

                if (pulse == 0) {
                    ultrasonicDistance = 255
                } else {
                    ultrasonicDistance = Math.idiv(pulse, ultrasonicDivisor)
                }

                basic.pause(200)
            } else {
                basic.pause(50)
            }
        }
    })

    /**
     * Calibrate the robot line sensor using default settings.
     */
    //% block="robot calibration"
    //% group="Tracer Junior"
    //% weight=100
    export function juniorRobotCalibration(): void {
        robotCalibration(MakeRobotCalibrationPin.P9, 120)
    }

    /**
     * Follow the line until the robot reaches a cross or obstacle.
     */
    //% block="robot line follow until %until"
    //% until.defl=MakeRobotLineFollowUntil.Cross
    //% group="Tracer Junior"
    //% weight=90
    export function robotLineFollowUntil(until: MakeRobotLineFollowUntil): void {
        setPidTuning(500, 0.6, 0.4, 0)

        if (until == MakeRobotLineFollowUntil.Obstacle) {
            lineFollowUntilObstacleWithPin(AnalogReadWritePin.P0, 150, 10)
        } else {
            lineFollowWithPin(AnalogReadWritePin.P0, 150, true, 500)
        }
    }

    /**
     * Move left, right, or u-turn from the current line position.
     */
    //% block="robot move %move"
    //% move.defl=MakeRobotMove.Left
    //% group="Tracer Junior"
    //% weight=80
    export function robotMove(move: MakeRobotMove): void {
        if (move == MakeRobotMove.Right) {
            turnToLineWithPin(MakeRobotTurnDirection.Right, 150, AnalogReadWritePin.P0)
        } else if (move == MakeRobotMove.Left) {
            turnToLineWithPin(MakeRobotTurnDirection.Left, 150, AnalogReadWritePin.P0)
        } else if (move == MakeRobotMove.UTurn) {
            turnToLineWithPin(MakeRobotTurnDirection.Right, 150, AnalogReadWritePin.P0)
            turnToLineWithPin(MakeRobotTurnDirection.Right, 150, AnalogReadWritePin.P0)
        }
    }

    /**
     * Calibrate the robot line sensor.
     */
    //% block="robot calibration pin %pin speed %speed"
    //% pin.defl=MakeRobotCalibrationPin.P9
    //% speed.min=0 speed.max=255 speed.defl=120
    //% group="Tracer Senior"
    //% weight=100
    //% blockHidden=true
    export function robotCalibration(pin: MakeRobotCalibrationPin, speed: number): void {
        const motorSpeed = limit(speed, 0, 255)
        const calibrationPin = calibrationPinValue(pin)

        enterCalibration(calibrationPin)
        runMotorSigned(leftMotorChannel, -motorSpeed)
        runMotorSigned(rightMotorChannel, motorSpeed)
        basic.pause(1000)
        runMotorSigned(leftMotorChannel, motorSpeed)
        runMotorSigned(rightMotorChannel, -motorSpeed)
        basic.pause(2000)
        runMotorSigned(leftMotorChannel, -motorSpeed)
        runMotorSigned(rightMotorChannel, motorSpeed)
        basic.pause(1000)
        robotStop()
        exitCalibration(calibrationPin)
    }

    /**
     * Set the left and right motor channels.
     */
    //% block="set motor left %left right %right"
    //% left.defl=MotionBitMotorChannel.M1
    //% right.defl=MotionBitMotorChannel.M3
    //% group="Tracer Senior"
    //% weight=90
    //% blockHidden=true
    export function setMotor(left: MotionBitMotorChannel, right: MotionBitMotorChannel): void {
        leftMotorChannel = left
        rightMotorChannel = right
    }

    /**
     * Set left and right motor speed directly.
     */
    //% block="set motors speed left %leftSpeed right %rightSpeed delay %delay"
    //% leftSpeed.min=-255 leftSpeed.max=255 leftSpeed.defl=0
    //% rightSpeed.min=-255 rightSpeed.max=255 rightSpeed.defl=0
    //% delay.min=0 delay.defl=0
    //% inlineInputMode=inline
    //% group="Tracer Senior"
    //% weight=80
    //% blockHidden=true
    export function setMotorsSpeed(leftSpeed: number, rightSpeed: number, delay: number): void {
        runMotorSigned(leftMotorChannel, leftSpeed)
        runMotorSigned(rightMotorChannel, rightSpeed)

        if (delay > 0) {
            basic.pause(delay)
            robotStop()
        }
    }

    /**
     * Check where the line is detected on the Maker Line sensor.
     */
    //% block="line detected on %position"
    //% position.defl=MakeRobotLinePosition.Center
    //% group="Tracer Senior"
    //% weight=70
    //% blockHidden=true
    export function lineDetectedOn(position: MakeRobotLinePosition): boolean {
        const analogValue = pins.analogReadPin(AnalogReadWritePin.P0)

        if (position == MakeRobotLinePosition.None) {
            return analogValue < 81
        } else if (position == MakeRobotLinePosition.FarLeft) {
            return analogValue >= 81 && analogValue < 266
        } else if (position == MakeRobotLinePosition.Left) {
            return analogValue >= 266 && analogValue < 430
        } else if (position == MakeRobotLinePosition.Center) {
            return analogValue >= 430 && analogValue <= 593
        } else if (position == MakeRobotLinePosition.Right) {
            return analogValue > 593 && analogValue <= 757
        } else if (position == MakeRobotLinePosition.FarRight) {
            return analogValue > 757 && analogValue <= 941
        } else {
            return analogValue > 941
        }
    }

    /**
     * Return distance measured by ultrasonic sensor in centimeters.
     * Trig is fixed to P1 and Echo is fixed to P2.
     */
    //% block="ultrasonic distance (cm)"
    //% group="Tracer Senior"
    //% weight=60
    //% blockHidden=true
    export function readUltrasonic(): number {
        if (!ultrasonicEnabled) {
            ultrasonicEnabled = true
            basic.pause(300)
        }

        return ultrasonicDistance
    }

    /**
     * Set the PID tuning values.
     */
    //% block="set PID tuning setpoint %setpoint kp %kp kd %kd ki %ki"
    //% setpoint.defl=500
    //% kp.defl=0.6
    //% kd.defl=0.4
    //% ki.defl=0
    //% inlineInputMode=inline
    //% group="Tracer Expert"
    //% weight=100
    //% blockHidden=true
    export function setPidTuning(setpoint: number, kp: number, kd: number, ki: number): void {
        pidSetpoint = limit(setpoint, 0, 1023)
        pidKp = kp
        pidKd = kd
        pidKi = ki
        resetPid()
    }

    /**
     * Follow a line until a cross or timer condition.
     */
    //% block="robot line follow pin %pin speed %speed cross %cross timer to stop %stopTimer"
    //% pin.defl=MakeRobotLinePin.P0
    //% speed.min=0 speed.max=255 speed.defl=150
    //% cross.shadow="toggleOnOff"
    //% cross.defl=true
    //% stopTimer.min=0 stopTimer.defl=0
    //% inlineInputMode=inline
    //% group="Tracer Expert"
    //% weight=90
    //% blockHidden=true
    export function robotLineFollow(pin: MakeRobotLinePin, speed: number, cross: boolean, stopTimer: number): void {
        lineFollowWithPin(linePinValue(pin), speed, cross, stopTimer)
    }

    /**
     * Turn until the robot finds the line again.
     */
    //% block="robot turn to line %direction speed %speed pin %pin"
    //% direction.defl=MakeRobotTurnDirection.Left
    //% speed.min=0 speed.max=255 speed.defl=150
    //% pin.defl=MakeRobotLinePin.P0
    //% inlineInputMode=inline
    //% group="Tracer Expert"
    //% weight=80
    //% blockHidden=true
    export function robotTurnToLine(direction: MakeRobotTurnDirection, speed: number, pin: MakeRobotLinePin): void {
        turnToLineWithPin(direction, speed, linePinValue(pin))
    }

    /**
     * Stop the robot.
     */
    //% block="robot stop"
    //% group="Tracer Expert"
    //% weight=70
    //% blockHidden=true
    export function robotStop(): void {
        motionbit.brakeMotor(leftMotorChannel)
        motionbit.brakeMotor(rightMotorChannel)
    }

    function lineFollowWithPin(pin: AnalogReadWritePin, speed: number, cross: boolean, stopTimer: number): void {
        const baseSpeed = limit(speed, 0, 255)
        let speedLeft = baseSpeed
        let speedRight = baseSpeed
        let crossFound = false
        let endTime = 0
        let timerEndTime = 0

        resetPid()

        if (!cross && stopTimer > 0) {
            timerEndTime = input.runningTime() + stopTimer
        }

        while (true) {
            const adc = pins.analogReadPin(pin)

            if (!cross && timerEndTime > 0 && input.runningTime() >= timerEndTime) {
                break
            }

            if (adc > 941 && cross) {
                if (stopTimer <= 0) {
                    break
                }

                if (!crossFound) {
                    crossFound = true
                    endTime = input.runningTime() + stopTimer
                }
            }

            if (crossFound && input.runningTime() >= endTime) {
                break
            }

            if (adc < 81) {
                if (lastError < 0) {
                    speedLeft = 0
                    speedRight = baseSpeed
                } else {
                    speedLeft = baseSpeed
                    speedRight = 0
                }
            } else if (adc > 941) {
                speedLeft = baseSpeed
                speedRight = baseSpeed
            } else {
                const powerDiff = limit(pidPowerDiff(adc), -baseSpeed, baseSpeed)

                if (powerDiff < 0) {
                    speedLeft = baseSpeed + powerDiff
                    speedRight = baseSpeed
                } else {
                    speedLeft = baseSpeed
                    speedRight = baseSpeed - powerDiff
                }
            }

            runLineMotors(speedLeft, speedRight)
            basic.pause(5)
        }

        robotStop()
    }

    function lineFollowUntilObstacleWithPin(pin: AnalogReadWritePin, speed: number, obstacleDistance: number): void {
        const baseSpeed = limit(speed, 0, 255)
        let speedLeft = baseSpeed
        let speedRight = baseSpeed

        resetPid()
        readUltrasonic()

        while (true) {
            if (ultrasonicDistance <= obstacleDistance) {
                break
            }

            const adc = pins.analogReadPin(pin)

            if (adc < 81) {
                if (lastError < 0) {
                    speedLeft = 0
                    speedRight = baseSpeed
                } else {
                    speedLeft = baseSpeed
                    speedRight = 0
                }
            } else if (adc > 941) {
                speedLeft = baseSpeed
                speedRight = baseSpeed
            } else {
                const powerDiff = limit(pidPowerDiff(adc), -baseSpeed, baseSpeed)

                if (powerDiff < 0) {
                    speedLeft = baseSpeed + powerDiff
                    speedRight = baseSpeed
                } else {
                    speedLeft = baseSpeed
                    speedRight = baseSpeed - powerDiff
                }
            }

            runLineMotors(speedLeft, speedRight)
            basic.pause(5)
        }

        robotStop()
    }

    function turnToLineWithPin(direction: MakeRobotTurnDirection, speed: number, pin: AnalogReadWritePin): void {
        const motorSpeed = limit(speed, 0, 255)

        if (direction == MakeRobotTurnDirection.Left) {
            runMotorSigned(leftMotorChannel, -motorSpeed)
            runMotorSigned(rightMotorChannel, motorSpeed)
        } else {
            runMotorSigned(leftMotorChannel, motorSpeed)
            runMotorSigned(rightMotorChannel, -motorSpeed)
        }

        while (pins.analogReadPin(pin) >= 81) {
            basic.pause(5)
        }

        basic.pause(200)

        while (pins.analogReadPin(pin) < 81) {
            basic.pause(5)
        }

        robotStop()
    }

    function pidPowerDiff(adc: number): number {
        const error = adc - pidSetpoint
        const derivative = error - lastError

        integral += error
        lastError = error

        return error * pidKp + derivative * pidKd + integral * pidKi
    }

    function runLineMotors(speedLeft: number, speedRight: number): void {
        runMotorSigned(leftMotorChannel, limit(speedLeft, 0, 255))
        runMotorSigned(rightMotorChannel, limit(speedRight, 0, 255))
    }

    function runMotorSigned(channel: MotionBitMotorChannel, speed: number): void {
        const motorSpeed = limit(Math.abs(speed), 0, 255)

        if (speed >= 0) {
            motionbit.runMotor(channel, MotionBitMotorDirection.Forward, motorSpeed)
        } else {
            motionbit.runMotor(channel, MotionBitMotorDirection.Backward, motorSpeed)
        }
    }

    function enterCalibration(pin: DigitalPin): void {
        pins.digitalWritePin(pin, 0)
        basic.pause(2100)
        pins.digitalWritePin(pin, 1)
    }

    function exitCalibration(pin: DigitalPin): void {
        pins.digitalWritePin(pin, 0)
        basic.pause(100)
        pins.digitalWritePin(pin, 1)
    }

    function linePinValue(pin: MakeRobotLinePin): AnalogReadWritePin {
        if (pin == MakeRobotLinePin.P1) {
            return AnalogReadWritePin.P1
        } else if (pin == MakeRobotLinePin.P2) {
            return AnalogReadWritePin.P2
        } else {
            return AnalogReadWritePin.P0
        }
    }

    function calibrationPinValue(pin: MakeRobotCalibrationPin): DigitalPin {
        if (pin == MakeRobotCalibrationPin.P12) {
            return DigitalPin.P12
        } else if (pin == MakeRobotCalibrationPin.P13) {
            return DigitalPin.P13
        } else if (pin == MakeRobotCalibrationPin.P14) {
            return DigitalPin.P14
        } else if (pin == MakeRobotCalibrationPin.P15) {
            return DigitalPin.P15
        } else if (pin == MakeRobotCalibrationPin.P16) {
            return DigitalPin.P16
        } else {
            return DigitalPin.P9
        }
    }

    function resetPid(): void {
        lastError = 0
        integral = 0
    }

    function limit(value: number, min: number, max: number): number {
        if (value < min) {
            return min
        }

        if (value > max) {
            return max
        }

        return value
    }
}
