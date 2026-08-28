// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract DIDRegistry is ERC721, ERC721Enumerable, Ownable {
    using Strings for uint256;

    string public constant BASE_URI = "https://civicchain.io/did/";

    mapping(address => bool) internal _isVerified;
    mapping(address => string) internal _dids;
    mapping(string => bool) internal _didExists;
    mapping(address => uint256) internal _addressToTokenId;
    mapping(uint256 => address) internal _tokenIdToAddress;

    event DIDRegistered(
        address indexed wallet,
        uint256 indexed tokenId,
        string did,
        uint256 timestamp
    );

    event DIDVerified(address indexed wallet, bool verified, uint256 timestamp);

    modifier onlyVerified() {
        require(_isVerified[msg.sender], "DIDRegistry: Wallet must be verified");
        _;
    }

    constructor() ERC721("CivicChain DID", "CIVIC") {
    }

    function registerDID(string memory did) external {
        require(bytes(did).length > 0, "DIDRegistry: DID cannot be empty");
        require(!_didExists[did], "DIDRegistry: DID already exists");

        uint256 tokenId = nextTokenId();
        _safeMint(msg.sender, tokenId);

        _dids[msg.sender] = did;
        _didExists[did] = true;
        _addressToTokenId[msg.sender] = tokenId;

        emit DIDRegistered(msg.sender, tokenId, did, block.timestamp);
    }

    function verifyDID(address wallet) external onlyOwner {
        require(wallet != address(0), "DIDRegistry: Invalid wallet address");

        _isVerified[wallet] = true;

        emit DIDVerified(wallet, true, block.timestamp);
    }

    function isRegistered(address wallet) external view returns (bool) {
        return _addressToTokenId[wallet] != 0;
    }

    function getDID(address wallet) external view returns (string memory) {
        require(
            isRegistered(wallet),
            "DIDRegistry: Wallet not registered"
        );
        return _dids[wallet];
    }

    function getVerificationStatus(address wallet) external view returns (bool) {
        return _isVerified[wallet];
    }

    function nextTokenId() internal view returns (uint256) {
        return totalSupply() + 1;
    }

    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        require(
            _exists(tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );

        return string(abi.encodePacked(BASE_URI, tokenId.toString()));
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}