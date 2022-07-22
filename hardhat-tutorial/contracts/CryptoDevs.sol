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

/**
        * @dev tokenURI overides the Openzeppelin's ERC721 implementation for tokenURI function
        * This function returns the URI from where we can extract the metadata for a given tokenId
 */
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
            require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");

            string memory baseURI = _baseURI();
            // Here it checks if the length of the baseURI is greater than 0, if it is return the baseURI and attach
            // the tokenId and `.json` to it so that it knows the location of the metadata json file for a given
            // tokenId stored on IPFS
            // If baseURI is empty return an empty string
            return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, Strings.toString(tokenId), ".json")) : "";
        }
//
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