// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IWhitelist.sol";

contract CryptoDevs is ERC721Enumerable, Ownable {

    string _baseTokenURI;

    IWhitelist whitelist;


    bool public presaleStarted;
    uint256 public presaleEnded;
    uint256 public maxTokenIds = 333;
    uint256 public tokenIds;
    uint256 public _price = 0.0 ether;

    bool public _paused;

    modifier onlyWhenNotPaused {
        require(!_paused, "Contract paused");
        _;
    }

    constructor(string memory baseURI, address whitelistContract) ERC721 ("Crypto Devs", "CD"){
        _baseTokenURI = baseURI;
        whitelist = IWhitelist(whitelistContract);
    }

    function startPresale() public onlyOwner {
        presaleStarted = true;
        presaleEnded = block.timestamp + 5 minutes;
    }

    function presaleMint() public payable onlyWhenNotPaused {
        require(presaleStarted && block.timestamp < presaleEnded, "Presale Ended");
        require(whitelist.whitelistedAddresses(msg.sender),"You are not in the whitelist");
        require(tokenIds < maxTokenIds, "Exceeded the limit");
        require(msg.value >= _price, "not enough ETH");

        tokenIds += 1;

        _safeMint(msg.sender, tokenIds);
    }

    function mint() public payable onlyWhenNotPaused {
        require(presaleStarted && block.timestamp >= presaleEnded,"presale ended");
        require(tokenIds < maxTokenIds, "Exceeded the limit");
        require(msg.value >= _price, "not enough ETH");

        tokenIds += 1;

        _safeMint(msg.sender, tokenIds);
    }

    function _baseURI() internal view override returns (string memory){
        return _baseTokenURI;
    }

    function setPause(bool val) public onlyOwner {
        _paused = val;
    }

    function withdraw () public onlyOwner {
        address _owner = owner();
        uint256 amount = address(this).balance;
        (bool sent, ) = _owner.call{value:amount} ("");
        require(sent, "Failed to send ETH");
    }

    receive() external payable{}
    fallback() external payable{}
}