import Image from "next/image";
import { LinkedIn } from '@mui/icons-material';

export default function OurTeam() {
  const teams = [
    {
      img: "/Hussein.png",
      name: "Hussein Oyelaja",
      position: "FullStack Developer",
      linkedin: "https://www.linkedin.com/in/oyelaja-hussein/",
    },
    {
      img: "/Bhumika.png",
      name: "Bhumika Mallikarjun",
      position: "FullStack Developer",
      linkedin: "https://www.linkedin.com/in/bhumika-mallikarjun/",
    },
    {
      img: "/Rajesh.jpg",
      name: "Rajesh Kumar Bhatt",
      position: "FullStack Developer",
      linkedin: "https://www.linkedin.com/in/rajesh-kumar-bhatt-aba8361b/"
    },
    {
      img: "/Hanna.jpg",
      name: "Hanna Vorontsova",
      position: "FullStack Developer",
      linkedin: "https://www.linkedin.com/in/hanna-vorontsova-2417a6115/",
    },
  ];
  return (
    <div className="py-5">
  <div className="text-left text-gray-600 max-w-4xl mx-auto px-4 sm:px-6">
    <h3 className="text-xl sm:text-2xl font-bold mb-2">
      Crafted with Passion by HackYourFuture's Finest
    </h3>
    <p className="text-left max-w-full sm:max-w-2xl mb-4">
      Our team is a powerhouse of talent, creativity, and determination, proudly brought together by HackYourFuture.
    </p>
  </div>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {teams.map((team, index) => (
          <div
            key={team.name}
            className="bg-gray-200 border border-gray-300 rounded-lg shadow-md w-56 h-72 mx-auto flex flex-col" 
          >
            <div className="flex-1">
              <Image
                src={team.img}
                alt={team.name}
                width={224}
                height={224} 
                className="w-full h-full object-cover rounded-t-lg" 
              />
            </div>
  
             <div className="bg-gray-300 px-4 py-3 flex justify-between items-center rounded-b-lg"> 
              <div>
                <h3 className="text-sm font-bold text-gray-800">{team.name}</h3>
                <p className="text-xs text-gray-600">{team.position}</p>
              </div>
  
              <a
                href={team.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-8 h-8 bg-transparent border-1 border-black rounded-xlg" 
              >
                <LinkedIn style={{ color: 'black', fontSize: '40px' }} />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}  