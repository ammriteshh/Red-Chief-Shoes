import { facebook, instagram, shieldTick, support, truckFast, twitter } from "../assets/icons";
import { bigShoe1, bigShoe2, bigShoe3, customer1, customer2, shoe4, shoe5, shoe6, shoe7, thumbnailShoe1, thumbnailShoe2, thumbnailShoe3 } from "../assets/images";

export const navLinks = [
    { href: "#home", label: "Home" },
    { href: "#about-us", label: "About Us" },
    { href: "#products", label: "Products" },
    { href: "#contact-us", label: "Contact Us" },
];

export const shoes = [
    {
        thumbnail: thumbnailShoe1,
        bigShoe: bigShoe1,
    },
    {
        thumbnail: thumbnailShoe2,
        bigShoe: bigShoe2,
    },
    {
        thumbnail: thumbnailShoe3,
        bigShoe: bigShoe3,
    },
];

export const statistics = [
    { value: '1k+', label: 'Brands' },
    { value: '500+', label: 'Shops' },
    { value: '250k+', label: 'Customers' },
];

export const products = [
    {
        imgURL: shoe4,
        name: "RC3506 001 Lace-Up",
        price: "$200.20",
    },
    {
        imgURL: shoe5,
        name: "Low Ankle Lace-Free Loafers",
        price: "$210.20",
    },
    {
        imgURL: shoe6,
        name: "Leather Low Ankle Slip-On",
        price: "$220.20",
    },
    {
        imgURL: shoe7,
        name: "Genuine Leather Mid Ankle Lace-Up",
        price: "$230.20",
    },
];

export const services = [
    {
        imgURL: truckFast,
        label: "Free shipping",
        subtext: "Enjoy seamless shopping with our complimentary shipping service."
    },
    {
        imgURL: shieldTick,
        label: "Secure Payment",
        subtext: "Experience worry-free transactions with our secure payment options."
    },
    {
        imgURL: support,
        label: "Love to help you",
        subtext: "Our dedicated team is here to assist you every step of the way."
    },
];

export const reviews = [
    {
        imgURL: customer1,
        customerName: 'Morich Brown',
        rating: 4.8,
        feedback: "The attention to detail and the quality of the product exceeded my expectations. Highly recommended!"
    },
    {
        imgURL: customer2,
        customerName: 'Lota Mongeskar',
        rating: 3.9,
        feedback: "The product not only met but exceeded my expectations. I'll definitely be a returning customer!"
    }
];


export const footerLinks = [
    {
        title: "Customer Policy",
        links: [
            { name: "Return Policy", link: "https://redchief.in/page-detail/return-policy" },
            { name: "Unboxing Policy", link: "https://redchief.in/page-detail/unboxing-policy" },
            { name: "Privacy Policy", link: "https://redchief.in/page-detail/privacy-policy" },
            { name: "Terms & Conditions", link: "https://redchief.in/page-detail/terms-and-conditions" },
            { name: "FAQ", link: "https://redchief.in/page-detail/faq" },
            { name: "Customer Care", link: "https://redchief.in/page-detail/customer-care" },
        ],
    },
    {
        title: "Help",
        links: [
            { name: "About us", link: "https://redchief.in/page-detail/about-us1" },
            { name: "Design", link: "https://redchief.in/page-detail/design" },
            { name: "Franchise", link: "https://redchief.in/franchise" },
            { name: "News", link: "https://redchief.in/page-detail/news-and-events" },
            { name: "Blogs", link: "https://redchief.in/blogs/blog-list" },
        ],
    },
    {
        title: "Get in touch",
        links: [
            { name: "customer@redchief.com", link: "mailto:customer@redchief.com" },
            { name: "+917654387654", link: "tel:+917654387654" },
        ],
    },
];

export const socialMedia = [
    { 
        src: facebook, 
        alt: "facebook logo", 
        link: "https://www.facebook.com/redchiefofficial/" 
    },
    { 
        src: twitter, 
        alt: "twitter logo", 
        link: "https://x.com/Red_Chieftians" 
    },
    { 
        src: instagram, 
        alt: "instagram logo", 
        link: "https://www.instagram.com/redchiefofficial/  " 
    },
];

