// Editor Addins

// ============================================================================

/**
 * Editor Object This class is the base class for all objects
 * 
 */
function Addin() {
	this.type = null;
	this._renderable = null;
	this._fields = this._fields.concat([ 'type', 'renderable' ]);
}
Addin.inheritsFrom(Storable);

Addin.TAG_NAME = 'addin';

// Must align with constants in orm Addin class
// Addin types
Addin.GOTO_PAGE = 0;
Addin.SCALED_TELE_IND = 1;
Addin.COMMAND = 2;
Addin.DIGITAL_TELE_IND = 3;
Addin.DIGITAL_TELE_CTL = 4;
Addin.SCALED_TELE_CTL = 5;

// Class method
Addin.getConstructor = function(type) {
	switch (parseInt(type)) {
	case Addin.GOTO_PAGE:
		return GotoPageAddin;
	case Addin.SCALED_TELE_IND:
		return ScaledTeleIndAddin;
	case Addin.COMMAND:
		return CommandAddin;
	case Addin.DIGITAL_TELE_IND:
		return DigitalTeleIndAddin;
	case Addin.DIGITAL_TELE_CTL:
		return DigitalTeleCtlAddin;
	case Addin.SCALED_TELE_CTL:
		return ScaledTeleCtlAddin;
	default:
		assert(false, "Can not create Addin of type |" + type + "|");
	}
}

Addin.prototype.createFromXml = function(xmlTag) {
	var type = xmlGetChildrenByTag(xmlTag, 'type')[0].firstChild.nodeValue;
	type = parseInt(type);

	var Constructor = Addin.getConstructor(type);

	var addin = new Constructor();
	addin.updateFromXml(xmlTag);
	return addin

}

Addin.prototype.tagName = function() {
	return Addin.TAG_NAME;
}

Addin.prototype.type = function() {
	return this.type;
}

Addin.prototype.setRenderable = function(id) {
	return this._renderable = id;
}

// ============================================================================
// Goto Page

function GotoPageAddin() {
	this.type = Addin.GOTO_PAGE;

	this.page = null;

	this._fields = this._fields.concat([ 'page' ]);
}
GotoPageAddin.inheritsFrom(Addin);

//============================================================================
//Scaled Telemetered Indication Addin

function ScaledTeleIndAddin() {
	this.type = Addin.SCALED_TELE_IND;

	this._targetField = null;
	this._tag = null;
	this._multiplier = null;
	this._offset = null;
	this._mappedValues = null;

	this._fields = this._fields.concat([ 'targetField', 'tag'
	                                     , 'multiplier', 'offset'
	                                     , "mappedValues"]);
}
ScaledTeleIndAddin.inheritsFrom(Addin);

//============================================================================
//Scaled Telemetered Control Addin

function ScaledTeleCtlAddin() {
	this.type = Addin.SCALED_TELE_CTL;

	this._targetField = null;
	this._tag = null;
	this._multiplier = null;
	this._offset = null;
	this._mappedValues = null;

	this._fields = this._fields.concat([ 'targetField', 'tag'
	                                     , 'multiplier', 'offset'
	                                     , "mappedValues"]);
}
ScaledTeleCtlAddin.inheritsFrom(Addin);

//============================================================================
//Digital Telemetered Indication Addin

function DigitalTeleIndAddin() {
	this.type = Addin.DIGITAL_TELE_IND;

	this._targetField = null;
	this._tag = null;
	//this._state0 = null;
	this._state1 = null;
	this._state2 = null;
	//this._state3 = null;

	this._fields = this._fields.concat([ 'targetField', 'tag', 'state1', 'state2' ]);

}
DigitalTeleIndAddin.inheritsFrom(Addin);

// ============================================================================
//Digital Telemetered Indication Addin

function DigitalTeleCtlAddin() {
	this.type = Addin.DIGITAL_TELE_CTL;

	this._targetField = null;
	this._tag = null;
	//this._state0 = null;
	this._state1 = null;
	this._state2 = null;
	//this._state3 = null;

	this._fields = this._fields.concat([ 'targetField', 'tag', 'state1', 'state2' ]);

}
DigitalTeleCtlAddin.inheritsFrom(Addin);

// ============================================================================
// Generic Command Addin

function CommandAddin() {
	this.type = Addin.COMMAND;

	this._command = null;

	this._fields = this._fields.concat([ 'command' ]);
}
CommandAddin.inheritsFrom(Addin);
