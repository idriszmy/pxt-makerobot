// Compile smoke tests for the public API.
// This file is not compiled when the package is used as an extension.

if (false) {
    MakeRobot.juniorRobotCalibration()
    MakeRobot.robotLineFollowUntilCross()
    MakeRobot.robotMove(MakeRobotMove.Left)

    MakeRobot.robotCalibration(MakeRobotCalibrationPin.P9, 120)
    MakeRobot.setMotor(MotionBitMotorChannel.M1, MotionBitMotorChannel.M3)
    MakeRobot.setMotorsSpeed(120, 120, 100)
    MakeRobot.lineDetectedOn(MakeRobotLinePosition.Center)

    MakeRobot.setPidTuning(500, 0.6, 0.4, 0)
    MakeRobot.robotLineFollow(MakeRobotLinePin.P0, 150, true, 0)
    MakeRobot.robotTurnToLine(MakeRobotTurnDirection.Left, 150, MakeRobotLinePin.P0)
    MakeRobot.robotStop()
}
