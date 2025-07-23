// pixTON.tact
// Example Tact contract for pixTON Telegram bot

contract PixTONWallet {
    // Owner address (Telegram bot veya kullanıcıya ait olabilir)
    address owner;

    // Event: Payment received
    event PaymentReceived(address from, uint128 amount, cell payload);

    // Constructor: Set owner
    constructor(address _owner) {
        owner = _owner;
    }

    // Receive TON payments
    receive() external payable {
        emit PaymentReceived(msg.sender, msg.value, msg.data);
    }

    // Withdraw function (only owner)
    function withdraw(address to, uint128 amount) external {
        require(msg.sender == owner, 100);
        to.transfer(amount);
    }

    // Change owner (only owner)
    function setOwner(address newOwner) external {
        require(msg.sender == owner, 101);
        owner = newOwner;
    }
} 