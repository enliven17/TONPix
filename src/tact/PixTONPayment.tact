// PixTONPayment.tact
// Gelişmiş örnek: Her ödeme isteği için ayrı kontrat

contract PixTONPayment {
    address owner;
    uint128 requestedAmount;
    bool paid;

    event PaymentReceived(address from, uint128 amount);

    constructor(address _owner, uint128 _requestedAmount) {
        owner = _owner;
        requestedAmount = _requestedAmount;
        paid = false;
    }

    // TON ile ödeme alındığında
    receive() external payable {
        require(!paid, 100); // Sadece bir kez ödeme alınabilir
        require(msg.value >= requestedAmount, 101); // Yeterli ödeme
        paid = true;
        emit PaymentReceived(msg.sender, msg.value);
        // Fazla ödeme varsa iade edilebilir (isteğe bağlı)
    }

    // Sahip kalan bakiyeyi çekebilir
    function withdraw() external {
        require(msg.sender == owner, 102);
        require(paid, 103);
        owner.transfer(address(this).balance);
    }

    // Ödeme durumu sorgulama
    function isPaid() external view returns (bool) {
        return paid;
    }
} 