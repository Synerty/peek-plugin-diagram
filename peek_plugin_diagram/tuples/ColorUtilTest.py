from unittest import TestCase

from peek_plugin_diagram.tuples.ColorUtil import _invertColor


class TestColorInversion(TestCase):
    def setUp(self):
        pass

    def test_twoWayInversion(self):
        black = "#000000ff"
        white = "#ffffffff"

        to = _invertColor(white, black, calibrate=False)
        back = _invertColor(to, white, calibrate=False)
        self.assertEqual(back, white)

    def test_cssColorHexShort(self):
        shortBlack = "#000"
        black = "#000000ff"
        white = "#ffffffff"

        to = _invertColor(shortBlack, white, calibrate=False)
        back = _invertColor(to, black, calibrate=False)
        self.assertEqual(back, black)

    def test_cssColorLiteral(self):
        whiteLiteral = "white"
        black = "#000000ff"
        white = "#ffffffff"

        to = _invertColor(whiteLiteral, black, calibrate=False)
        back = _invertColor(to, white, calibrate=False)
        self.assertEqual(back, white)

    def test_alpha(self):
        blackWithAlpha = "#000000ee"
        black = "#000000ff"
        white = "#ffffffff"

        to = _invertColor(blackWithAlpha, black, calibrate=False)
        back = _invertColor(to, white, calibrate=False)
        self.assertEqual(back, blackWithAlpha)

    def test_calibrate(self):
        black = "#000000ff"
        white = "#ffffffff"

        to = _invertColor(black, white, calibrate=True, colorShift=0.05)
        self.assertEqual(to, "#f1f1f1ff")

        to = _invertColor(white, black, calibrate=True, colorShift=0.05)
        self.assertEqual(to, "#070707ff")
