package config

import (
	"github.com/spf13/viper"
)

type Config struct {
	Port          string `mapstructure:"port"`
	RedisHost     string `mapstructure:"redis_host"`
	RedisPort     string `mapstructure:"redis_port"`
	RedisPassword string `mapstructure:"redis_password"`
}

func LoadConfig(path string) (Config, error) {
	var config Config

	viper.SetDefault("port", "8080")
	viper.SetDefault("redis_host", "localhost")
	viper.SetDefault("redis_port", "6379")
	viper.SetDefault("redis_password", "password")
	viper.AutomaticEnv()

	_ = viper.BindEnv("redis_host", "REDIS_HOST")
	_ = viper.BindEnv("redis_port", "REDIS_PORT")
	_ = viper.BindEnv("redis_password", "REDIS_PASSWORD")

	viper.SetConfigFile(path)
	if err := viper.ReadInConfig(); err != nil {
		return config, err
	}

	err := viper.Unmarshal(&config)
	return config, err
}
