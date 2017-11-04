import logging

from peek_plugin_diagram._private.storage.Display import DispText
from peek_plugin_diagram._private.storage.LiveDbDispLink import \
    LIVE_DB_KEY_DATA_TYPE_BY_DISP_ATTR
from peek_plugin_livedb.tuples.ImportLiveDbItemTuple import ImportLiveDbItemTuple

logger = logging.getLogger(__name__)


def _mergeInLiveDbValues(disp, liveDbItemByKey):
    for dispLink in disp.liveDbLinks:
        liveDbItem = liveDbItemByKey.get(dispLink.liveDbKey)
        if liveDbItem:
            _mergeInLiveDbValue(disp, dispLink, liveDbItem)


def _mergeInLiveDbValue(disp, dispLink, liveDbItem, value=None):
    # This allows us to change the value and use recursion a little
    # (Value is converted to different data types and recursively called, see below)
    if value is None:
        value = liveDbItem.displayValue

    # At least for colors and string :
    # If the color vale is None, set the attribute to None as well
    # At this stage we don't expect other data types to be None
    if value is None:
        keyType = LIVE_DB_KEY_DATA_TYPE_BY_DISP_ATTR[dispLink.dispAttrName]

        nullableTypes = (
            ImportLiveDbItemTuple.DATA_TYPE_COLOR,
            ImportLiveDbItemTuple.DATA_TYPE_STRING_VALUE
        )

        assert keyType in nullableTypes, (
            "keyType |%s| is not DATA_TYPE_COLOR\n"
            "==DISP LINK== %s\n"
            "==LIVE DB ITEM== %s"% (keyType, dispLink, liveDbItem))

        setattr(disp, dispLink.dispAttrName, None)
        return

    # ----------------------------
    # Not text
    if not (isinstance(disp, DispText) and dispLink.dispAttrName == "text"):
        setattr(disp, dispLink.dispAttrName, value)
        return

        # ----------------------------
    # Special case for Text

    # If there is no format, then just use the value
    if not disp.textFormat:
        disp.text = value
        return

    _applyTextFormat(disp, dispLink, liveDbItem, value)


def _applyTextFormat(disp, dispLink, liveDbItem, value):
    # If there is a format, then convert it.
    try:
        disp.text = (disp.textFormat % value)

    except TypeError as e:
        message = str(e)
        # Lazy format type detection
        try:
            if "number is required" in message:
                return _applyTextFormat(
                    disp, dispLink, liveDbItem, int(value))

            if "invalid literal for int" in message:
                return _applyTextFormat(
                    disp, dispLink, liveDbItem, int(value))

            if "an integer is required, not str" in message:
                return _applyTextFormat(
                    disp, dispLink, liveDbItem, int(value))

            if "float is required" in message:
                return _applyTextFormat(
                    disp, dispLink, liveDbItem, float(value))

            if "must be real number, not str" in message:
                return _applyTextFormat(
                    disp, dispLink, liveDbItem, float(value))

            if "could not convert string to float" in message:
                return _applyTextFormat(
                    disp, dispLink, liveDbItem, float(value))

        except ValueError as e:
            # We can't convert the value to int/float
            # Ignore the formatting, it will come good when the value does
            logger.debug("Failed to format |%s| value |%s| to |%s|",
                         liveDbItem.key, value, disp.textFormat)
            disp.text = ""

        logger.warn("DispText %s textFormat=|%s| value=|%s| failed with %s\n"
                    "This can occur if the LiveDbItem.rawValue has not yet been updated",
                    disp.id, disp.textFormat, value, message)
