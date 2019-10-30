pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

contract Base {
    address public Requestor;
    address public Responder;
}

contract HelloBlockchain is Base {
    enum StateType { Request, Respond }
    enum SwitcherEnum { On, Off }

    StateType public  State;
    SwitcherEnum public Flag;
    string public RequestMessage;
    string public ResponseMessage;

    constructor(string memory message) public {
        Requestor = msg.sender;
        RequestMessage = message;
        State = StateType.Request;
    }

    function SendRequest(string memory requestMessage, StateType state) public {
        RequestMessage = requestMessage;
        State = state;
    }

    function SendResponse(StateType state, SwitcherEnum flag) public {
        if (flag == SwitcherEnum.On) {
            Responder = msg.sender;
        }

        State = state;
    }

    function SwitcheToOff(uint completed) public {
        if(completed > 0) {
            Flag = SwitcherEnum.Off;
        }
    }
}
