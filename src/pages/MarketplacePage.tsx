
import { ArrowLeft, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const MarketplacePage = () => {
  const navigate = useNavigate();
  
  const products = [
    {
      title: "Premium Dashboard Template",
      price: "$49",
      category: "Templates",
      rating: 4.8,
    },
    {
      title: "Data Analysis Course",
      price: "$129",
      category: "Courses",
      rating: 4.9,
    },
    {
      title: "UI Component Library",
      price: "$79",
      category: "Development",
      rating: 4.7,
    }
  ];
  
  const categories = ["All", "Templates", "Courses", "Development", "Design"];

  return (
    <div className="pb-6">
      <div className="flex items-center space-x-4 mb-6">
        <button 
          onClick={() => navigate('/')}
          className="p-2 rounded-full bg-secondary/70 hover:bg-secondary"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-bold">Marketplace</h1>
      </div>
      
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
        <input 
          type="text" 
          placeholder="Search products..." 
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background"
        />
      </div>
      
      <div className="flex space-x-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
        {categories.map((category, index) => (
          <motion.button
            key={category}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap 
              ${index === 0 ? 'bg-veno-primary text-white' : 'bg-secondary text-foreground'}`}
          >
            {category}
          </motion.button>
        ))}
      </div>
      
      <h2 className="text-lg font-semibold mb-4">Featured Products</h2>
      
      <div className="grid gap-4">
        {products.map((product, index) => (
          <motion.div
            key={product.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className="veno-card p-5"
          >
            <div className="mb-3 h-32 bg-veno-muted rounded-lg flex items-center justify-center">
              <span className="text-veno-primary/70 text-sm">Product Image</span>
            </div>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{product.title}</h3>
                <p className="text-xs text-muted-foreground">{product.category} • ★ {product.rating}</p>
              </div>
              <span className="font-semibold text-veno-primary">{product.price}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MarketplacePage;
