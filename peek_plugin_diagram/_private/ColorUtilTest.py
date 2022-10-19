from unittest import TestCase

from peek_plugin_diagram._private.ColorUtil import invertColor


class TestColorInversion(TestCase):
    def setUp(self):
        pass

    def test_twoWayInversion(self):
        black = "#000000ff"
        white = "#ffffffff"

        to = invertColor(white, black)
        back = invertColor(to, white)
        self.assertEqual(back, white)

    def test_cssColorHexShort(self):
        shortBlack = "#000"
        black = "#000000ff"
        white = "#ffffffff"

        to = invertColor(shortBlack, white)
        back = invertColor(to, black)
        self.assertEqual(back, black)

    def test_cssColorLiteral(self):
        whiteLiteral = "white"
        black = "#000000ff"
        white = "#ffffffff"

        to = invertColor(whiteLiteral, black)
        back = invertColor(to, white)
        self.assertEqual(back, white)

    def test_alpha(self):
        blackWithAlpha = "#000000ee"
        black = "#000000ff"
        white = "#ffffffff"

        to = invertColor(blackWithAlpha, black)
        back = invertColor(to, white)
        self.assertEqual(back, blackWithAlpha)
